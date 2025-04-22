import { copyFileSync } from "fs"
import { Notice } from "obsidian"
import { registerObaCallback, runObaCallbacks } from "src/services-base/callbacks"
import { TaskState } from "src/tools-base/schedule-tools"
import { hash64Chain, randstring } from "src/tools-base/utils-tools"
import { _addDummyAndCommit, _justPush } from "./channels-base"
import { checkPusher, manifestJsonIO, modifyObaSyncManifest, ObaSyncManifest, ObaSyncManifestIder } from "./manifests-base"
import { ObaSyncScheduler } from "./obasync"
import { utcTimeTag } from "./utils-base"

// MARK: base
export type HandlingStatus = "processed.ok" | "issued" | "unknown" | "error" | null
export interface ObaSyncSignal {
    "type"?: string,
    "timestamp"?: string,
    "userName0"?: string,
    "callback"?: string
    "handlingStatus"?: HandlingStatus
    "hashKey"?: string,
    "args"?: {[keys: string]: any} 
}

export interface ObaSyncCallbackContext {
    "userName0": string,
    "userName1": string,
    "vaultDepot": string,
    "pullDepot": string,
    "pushDepot": string,
    "manIder": ObaSyncManifestIder,
    "signal1HashKey": string,
    "signal1": ObaSyncSignal | null,
    "args"?: {[keys: string]: any} | null
}

function _signalHashKey(val0: string, ...vals: string[]) {
    const hash = hash64Chain(val0, ...vals)
    return hash
}

interface _setSignalArgs {
    issuerName: string, 
    channelName: string, 
    signalTemplate: ObaSyncSignal, 
    hashDig: string[], // ignored if hashKey is passed
    manContent: ObaSyncManifest, 
    hashKey: string | null, 
}

function _setSignal({ 
    issuerName, 
    channelName, 
    signalTemplate, 
    hashDig,
    hashKey = null,
    manContent, 
}:_setSignalArgs ): ObaSyncSignal { 

    manContent['signals'] = manContent?.['signals'] || {}
    signalTemplate['type'] = signalTemplate?.['type'] || 'obasync.unknown.signal.type'
    signalTemplate['timestamp'] = signalTemplate?.['timestamp'] || utcTimeTag()
    hashKey = signalTemplate['hashKey'] = hashKey || _signalHashKey(
        issuerName, channelName, signalTemplate['type'], 
        ...hashDig
    )
    manContent['signals'][hashKey] = signalTemplate
    return signalTemplate

}

// MARK: commit 
/*
    This is an offline method
*/ 
interface commitObaSyncSignalArgs {
    vaultDepot: string,
    pushDepot: string,
    issuerName: string,
    channelName: string,
    manType: string,
    signalTemplate: ObaSyncSignal,
    hashKey: string | null, 
    hashDig: string[],
    callback?: (() => any),
}

export async function commitObaSyncSignal({
    vaultDepot,
    pushDepot,
    issuerName,
    channelName,
    manType,
    signalTemplate,
    hashDig = [],
    hashKey = null,
    callback = () => null,
}: commitObaSyncSignalArgs) {

    // checkpoint vault
    await _addDummyAndCommit(vaultDepot, "obasync.pre.commit.signal", "123")
    
    // mod vault manifest
    await _addDummyAndCommit(vaultDepot, "pre.commit.signal", randstring())
    await _addDummyAndCommit(pushDepot, "pre.commit.signal", "123")

    // mod vault manifest
    const vManIder: ObaSyncManifestIder = { manType, channelName }
    const vManIO = manifestJsonIO(vaultDepot, vManIder)

    let signal = signalTemplate;
    modifyObaSyncManifest(
        vManIO,
        issuerName,
        {channelName, manType}, 
        (manContent: any) => {
            // new
            signal = _setSignal({
                issuerName, channelName, manContent, 
                signalTemplate, hashDig, hashKey
            }) 
        }
    )
    
    // ii. setup push depot
    // check pusher
    const rManIO = manifestJsonIO(pushDepot, { manType, channelName })
    if (!checkPusher(vManIder, rManIO)) { return; }

    // iii. callback
    const flag = await callback()
    if (flag == 'abort') { return; }

    // iv. copy vault manifest to push depot
    console.log(`Copying manifests`)
    const srcManFile = vManIO.retFile()
    const destManFile = rManIO.retFile()
    copyFileSync(srcManFile, destManFile)
    console.log(`Copied ${srcManFile} -> ${destManFile}`)
    console.log(`man0: `, vManIO.loadd({}).retDepot())
    console.log(`man1: `, rManIO.loadd({}).retDepot())

    // v. git add/commit
    await _addDummyAndCommit(pushDepot, "post.commit.signal", "123")
    await _justPush(pushDepot, { tout: 10 })

    const msg = [
        `Signal committed`,
        ` - issuerName: ${issuerName}`,
        ` - channelName: ${channelName}`,
        ` - signalType: ${signal["type"]}`,
        ` - signalHash: ${signal["hashKey"]}`,
    ].join("\n")
    console.log(msg)
    console.log('Committed signal: ', signal)
    new Notice(msg, 1 * 60 * 1000)
}

// MARK: process
/*
    Run the callbacks for each signal event
    - bla0 means something from my manifest
    - bla1 means something from other user manifest
    This is an offline method
*/ 

interface runSignalEventsArgs {
    vaultDepot: string,
    pushDepot: string,
    pullDepot: string,
    userName0: string, 
    channelName: string, 
    manType: string
}

export interface SignalEventCallbackArgs {
    context: ObaSyncCallbackContext, 
    eventID: ObaSyncEventID
}


export type ObaSyncEventID =
    `obasync.signal0.missing` |
    `obasync.signals.both.timetags.present` | 
    `obasync.signal0.timetag.newer` | 
    `obasync.signal0.timetag.missing.or.newer` | 
    `obasync.signals.both.timetags.equal` | 
    `obasync.signal0.timetag.older` | 
    `obasync.signal0.timetag.missing.or.older` |
    `obasync.signal0.timetag.missing` | 
    `obasync.signal1.timetag.missing` | 
    `obasync.signals.both.timetags.missing`


/*
    Check manifests and run event callbacks
*/ 
export async function runSignalEvents({
    vaultDepot,
    pushDepot,
    pullDepot,
    userName0, 
    channelName, 
    manType
}: runSignalEventsArgs) {

    // checkpoint vault
    await _addDummyAndCommit(vaultDepot, "obasync.pre.run.signal.event", "123")

    // load manifests
    const manIder = { channelName, manType }
    console.log("manIder: ", manIder)
    const man0IO = manifestJsonIO(vaultDepot, manIder)
    const man0: ObaSyncManifest = man0IO.loaddOnDemand({}).retDepot()
    const man0Signals = man0['signals'] = man0?.['signals'] || {}
    console.log("man0Signals: ", man0Signals)
    // TODO/TAI thisnk using "modified.time" or a field in the man itself
    // const man0IOContentHash0 = objectHash(man0, {respectType: false, algorithm: 'sha1'})
    // console.log("man0IOContentHash0: ", man0IOContentHash0)

    const man1IO = manifestJsonIO(pullDepot, manIder)
    const man1: ObaSyncManifest = man1IO.loaddOnDemand({}).retDepot()
    const userName1 = man1?.['meta']?.["userName"] || "JohnDoe"
    const man1Signals = man1['signals'] = man1?.['signals'] || {}
    console.log("man1Signals: ", man1Signals)
    
    // handle issued signals
    let callbackID;
    let eventID: ObaSyncEventID;

    for (const signal1HashKey in man1Signals) {
        console.log("signal1HashKey: ", signal1HashKey)

        // signal content
        const signal1: ObaSyncSignal = man1Signals[signal1HashKey]
        const signal1Type = signal1['type']

        // get record
        let signal0 = man0Signals?.[signal1HashKey]

        // call context
        const context: ObaSyncCallbackContext = {
            manIder, userName0, userName1, 
            signal1HashKey, signal1, 
            vaultDepot, pullDepot, pushDepot
        }

        // callback
        if (!signal0) {
            // run callbacks
            eventID = `obasync.signal0.missing`
            callbackID = `${eventID}:${signal1Type}`
            await runObaCallbacks(callbackID, {context, eventID})
            eventID = `obasync.signal0.timetag.missing.or.newer`
            callbackID = `${eventID}:${signal1Type}`
            await runObaCallbacks(callbackID, {context, eventID})
            eventID = `obasync.signal0.timetag.missing.or.older`
            callbackID = `${eventID}:${signal1Type}`
            await runObaCallbacks(callbackID, {context, eventID})
        }

        const timestamp1Str = signal1?.['timestamp']
        const timestamp0Str = signal0?.['timestamp']
        if (timestamp0Str && timestamp1Str) {
            const timestamp1 = new Date(timestamp1Str)
            const timestamp0 = new Date(timestamp0Str)

            // callback
            eventID = `obasync.signals.both.timetags.present`
            callbackID = `${eventID}:${signal1Type}`
            await runObaCallbacks(callbackID, {context, eventID})

            // callback
            if (timestamp0 < timestamp1) {
                // mine.newer
                eventID = `obasync.signal0.timetag.older`
                callbackID = `${eventID}:${signal1Type}`
                await runObaCallbacks(callbackID, {context, eventID})
                eventID = `obasync.signal0.timetag.missing.or.older`
                callbackID = `${eventID}:${signal1Type}`
                await runObaCallbacks(callbackID, {context, eventID})
            }
            // callback
            if (timestamp0 == timestamp1) {
                // both.equal
                eventID = `obasync.signals.both.timetags.equal`
                callbackID = `${eventID}:${signal1Type}`
                await runObaCallbacks(callbackID, {context, eventID})
            }
            // callback
            if (timestamp0 > timestamp1) {
                // both.equal
                eventID = `obasync.signal0.timetag.newer`
                callbackID = `${eventID}:${signal1Type}`
                await runObaCallbacks(callbackID, {context, eventID})
                eventID = `obasync.signal0.timetag.missing.or.newer`
                callbackID = `${eventID}:${signal1Type}`
                await runObaCallbacks(callbackID, {context, eventID})
            }
        }

        // callback
        if (!timestamp0Str && timestamp1Str) {
            eventID = `obasync.signal0.timetag.missing`
            callbackID = `${eventID}:${signal1Type}`
            await runObaCallbacks(callbackID, {context, eventID})
        }

            // callback
            if (timestamp0Str && !timestamp1Str) {
                eventID = `obasync.signal1.timetag.missing`
                callbackID = `${eventID}:${signal1Type}`
                await runObaCallbacks(callbackID, {context, eventID})
            }

        // callback
        if (!timestamp0Str && !timestamp1Str) {
            eventID = `obasync.signals.both.timetags.missing`
            callbackID = `${eventID}:${signal1Type}`
            await runObaCallbacks(callbackID, {context, eventID})
        }
    } // for (const signal1HashKey in man1Issued)

}

// MARK: register
export interface SignalHandlerArgs {
    context: ObaSyncCallbackContext, 
    eventID: ObaSyncEventID, 
    task: TaskState
}

type SignalHandlerType = (arg: SignalHandlerArgs) => 
    (HandlingStatus | Promise<HandlingStatus>)

export interface registerSignalEventHandlerArgs {
    handler: SignalHandlerType,
    eventID: ObaSyncEventID, 
    signalType: string, 
    deltaGas?: number,
    taskIDDigFun?: (context: ObaSyncCallbackContext) => string[]
}


export function registerSignalEventHandler({
    handler,
    eventID,
    signalType, 
    deltaGas = 1,
    taskIDDigFun = (() => [])
}: registerSignalEventHandlerArgs) {
    const callbackID = `${eventID}:${signalType}`
    
    registerObaCallback(callbackID, 
        async (args: SignalEventCallbackArgs) => {
            const context0 = args["context"]
            const eventID0 = args["eventID"]
            if (eventID != eventID0) {
                console.error(`Nonmatching eventIDs, ${eventID} != ${eventID0}`)
                return;
            }

            const taskIDDig = taskIDDigFun(context0)
            const taskID = hash64Chain(callbackID, ...taskIDDig)
            ObaSyncScheduler.spawn({
                id: taskID, 
                deltaGas,
                taskFun: async (task: TaskState) => {
                    const status = await handler({context: context0, eventID, task})

                    if (status == "processed.ok") {

                        // extract
                        // TODO/ add "issuedBy" into signal
                        // TODO/ add "issuedBy.first" into signal
                        const vaultDepot = context0["vaultDepot"]
                        const pushDepot = context0["pushDepot"]
                        const manIder = context0["manIder"]
                        const manType = manIder["manType"]
                        const channelName = manIder["channelName"]
                        const userName0 = context0["userName0"]
                        const userName1 = context0["userName1"]
                        const signal1 = context0["signal1"]
                        const signal1HashKey = context0["signal1HashKey"]

                        const msg = [
                            `Signal processed succesfully`,
                            ` - issuedBy: ${userName1}`,
                            ` - pullerName: ${userName0}`,
                            ` - channelName: ${channelName}`,
                            ` - signalType: ${signalType}`,
                            ` - signalHash: ${signal1HashKey}`,
                            ` - eventID: ${eventID}`,
                        ].join("\n")
                        new Notice(msg, 1 * 60 * 1000)
                        console.log(msg, 0)
                        
                        // record signal in vault manifest
                        await commitObaSyncSignal({
                            vaultDepot,
                            pushDepot,
                            issuerName: userName1,
                            channelName,
                            manType,
                            signalTemplate: signal1,
                            hashKey: signal1HashKey,
                            hashDig: []
                        })
                        
                    }
                    if (status == "issued") {
                    }
                    if (status == "unknown") {
                        console.warn(`Signal status 'error': ${eventID}:${signalType}`)
                    }
                    if (status == "error") {
                        console.error(`Signal status 'error': ${eventID}:${signalType}`)
                    }
                }
            })
        }
    )
}

function sendObaSyncSignal(

) {

}


// // MARK: run
// async function _runHandlingCallback(
//     callbackID: string,
//     directCallback: ((...args: any[]) => any),
//     context: ObaSyncCallbackContext,
//     {
//         onOk = () => null,
//         onUnknown = () => null,
//         onFailed = () => null
//     } : {
//         onOk: (() => any),
//         onUnknown: (() => any),
//         onFailed: (() => any),
//     }
// ) {
//     // reset status
//     context['handlingStatus'] = 'unknown' as HandlingStatus
    
//     // Run callback
//     await runObaCallbacks(callbackID, {context, eventID})
//     await directCallback(callbackID, context)

//     // Validate run
//     // const context = {userName0, userName1, signal1HashKey, signal1, man0Signals, handlingStatus: 'unknown'}
//     const man0Signals = context["man0Signals"]
//     const hashKey = context["signal1HashKey"]
//     const signal1: ObaSyncSignal = context["signal1"]
//     const userName1 = context["userName1"]
//     const status = context['handlingStatus']

//     if (status == "processed.ok") {
//         man0Signals[hashKey] = {
//             ...signal1,
//             'userName0': userName1,
//             'callback': 'obasync.signal.missing.in.record0',
//             'handlingStatus': status
//         } as ObaSyncProcessedSignal
//         console.log(`Callback handled, callbackID:  ${callbackID},  status: ${status}`)
//         await onOk()
//     } else if (status == 'unknown') {
//         console.warn(`Unknown status, callbackID:  ${callbackID}`)
//         await onUnknown()
//     } else {
//         const msg = `Callback failed, callbackID:  ${callbackID},  status: ${status}`
//         console.error(msg)
//         new Notice(msg)
//         await onFailed()
//     }
// }