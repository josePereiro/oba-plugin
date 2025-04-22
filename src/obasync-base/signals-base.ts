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
export type HandlingStatus = "handler.ok" | "unhandled" | "unknown" | "error" | null
export interface ObaSyncSignal {
    "type": string,

    "creator.timestamp"?: string,
    "creator.hashKey"?: string,
    "creator.name"?: string,
    "creator.channelName"?: string,

    "committer.name"?: string,
    "committer.timestamp"?: string,

    "handler.name"?: string
    "handler.callback"?: string
    "handler.timestamp"?: string,
    "handler.handlingStatus"?: HandlingStatus
    
    "args"?: {[keys: string]: any} 
}

export interface ObaSyncCallbackContext {
    "vaultUserName": string,
    "pulledUserName": string,
    "vaultDepot": string,
    "pullDepot": string,
    "pushDepot": string,
    "manIder": ObaSyncManifestIder,
    "pulledSignalKey": string,
    "pulledSignal": ObaSyncSignal | null,
    "args"?: {[keys: string]: any} | null
}

function _signalHashKey(val0: string, ...vals: string[]) {
    const hash = hash64Chain(val0, ...vals)
    return hash
}

// MARK: publish
/*
    This is an offline method
*/ 

export interface _publishSignalArgs {
    vaultDepot: string,
    pushDepot: string,
    committerName: string,
    manIder: ObaSyncManifestIder,
    signalTemplate: ObaSyncSignal,
    hashDig: string[],
    callback?: (() => any),
}

export function _publishedSignalNotification(
    signal: ObaSyncSignal
) {
    const msg = [
        `Signal committed`,
        ` - type: ${signal["type"]}`,
        ` - creator.name: ${signal["creator.name"]}`,
        ` - committer.name: ${signal["committer.name"]}`,
        ` - creator.channelName: ${signal["creator.channelName"]}`,
        ` - creator.hashKey: ${signal["creator.hashKey"]}`,
        ` - creator.timestamp: ${signal["creator.timestamp"]}`,
    ].join("\n")
    console.log(msg)
    console.log('Committed signal: ', signal)
    new Notice(msg, 1 * 60 * 1000)
}

export async function _publishSignal_offline_uncommitted({
    vaultDepot,
    pushDepot,
    committerName,
    manIder,
    signalTemplate,
    hashDig,
    callback = () => null,
}: _publishSignalArgs ) {

    // mod vault manifest
    const vManIO = manifestJsonIO(vaultDepot, manIder)
    const signalType = signalTemplate["type"]

    let signal = signalTemplate;
    modifyObaSyncManifest(
        vManIO,
        committerName,
        manIder, 
        (manContent: any) => {
            // new
            // 'type': string,
            
            // 'creator.timestamp'?: string,
            signalTemplate['creator.timestamp'] = 
                signalTemplate?.['creator.timestamp'] ||
                utcTimeTag()
            // 'creator.hashKey'?: string,
            const hashKey = signalTemplate['creator.hashKey'] = 
                signalTemplate?.['creator.hashKey'] ||
                _signalHashKey(signalType, ...hashDig)
                // _signalHashKey(committerName, channelName, signalType, ...hashDig)
                // NOTE: this was creating |committerNames| x |channelNames| x |signalTypes|
                // 'different' signals
                // If you want a signal to be unique per committerNames and channelNames
                // you can just add it to hashDig
            // 'creator.name'?: string,
            signalTemplate['creator.name'] = 
                signalTemplate?.['creator.name'] ||
                committerName
            // 'creator.channelName'?: string,
            signalTemplate['creator.channelName'] = 
                signalTemplate?.['creator.channelName'] ||
                manIder["channelName"]

            // 'committer.name'?: string,
            signalTemplate['committer.name'] = committerName
            // 'committer.timestamp'?: string,
            signalTemplate['committer.timestamp'] = utcTimeTag()

            // add to signals
            manContent['signals'] = manContent?.['signals'] || {}
            manContent['signals'][hashKey] = signalTemplate
            return signalTemplate
        }
    )
    
    // setup push depot
    // check pusher
    const rManIO = manifestJsonIO(pushDepot, manIder)
    if (!checkPusher(manIder, rManIO)) { return null; }

    // callback
    const flag = await callback()
    if (flag == 'abort') { return null; }

    // copy vault manifest to push depot
    console.log(`Copying manifests`)
    const srcManFile = vManIO.retFile()
    const destManFile = rManIO.retFile()
    copyFileSync(srcManFile, destManFile)
    console.log(`Copied ${srcManFile} -> ${destManFile}`)
    console.log(`vaultMan: `, vManIO.loadd({}).retDepot())
    console.log(`pulledMan: `, rManIO.loadd({}).retDepot())

    return signal
}

export async function _publishSignal_offline_committed(args: _publishSignalArgs) {

    // checkpoint vault
    await _addDummyAndCommit(args["vaultDepot"], "pre.publish.signal", "123")
    await _addDummyAndCommit(args["pushDepot"], "pre.publish.signal", "123")

    // publish
    const signal = await _publishSignal_offline_uncommitted(args)
    if (!signal) { return null; }

    // git add/commit
    await _addDummyAndCommit(args["pushDepot"], "post.publish.signal", "123")
    
    return signal 
}

export async function _publishSignal_online_committed(args: _publishSignalArgs) {

    // publish/commit
    const signal = await _publishSignal_offline_committed(args)
    if (!signal) { return null; }

    // push
    await _justPush(args["pushDepot"], { tout: 10 })
    
    return signal 
}

// MARK: resolve
/*
    Run the callbacks for each signal event
    - bla0 means something from vault manifest
    - bla1 means something from puller manifest
    This is an offline method
*/ 

interface runSignalEventsArgs {
    vaultDepot: string,
    pushDepot: string,
    pullDepot: string,
    vaultUserName: string, 
    channelName: string, 
    manType: string
}

export interface SignalEventCallbackArgs {
    context: ObaSyncCallbackContext, 
    eventID: ObaSyncEventID
}


export type ObaSyncEventID =
    `obasync.vault.signal.missing` |
    `obasync.signals.both.ctimetags.present` | 
    `obasync.vault.signal.ctimetag.newer` | 
    `obasync.vault.signal.ctimetag.missing.or.newer` | 
    `obasync.signals.both.ctimetags.equal` | 
    `obasync.vault.signal.ctimetag.older` | 
    `obasync.vault.signal.ctimetag.missing.or.older` |
    `obasync.vault.signal.ctimetag.missing` | 
    `obasync.pulled.signal.ctimetag.missing` | 
    `obasync.signals.both.ctimetags.missing`


/*
    Check manifests and run event callbacks
*/ 
export async function runSignalEvents({
    vaultDepot,
    pushDepot,
    pullDepot,
    vaultUserName, 
    channelName, 
    manType
}: runSignalEventsArgs) {

    // checkpoint vault
    await _addDummyAndCommit(vaultDepot, "obasync.pre.run.signal.event", "123")

    // load manifests
    const manIder = { channelName, manType }
    console.log("manIder: ", manIder)
    const vaultManJIO = manifestJsonIO(vaultDepot, manIder)
    const vaultMan: ObaSyncManifest = vaultManJIO.loaddOnDemand({}).retDepot()
    const vaultManSignals = vaultMan['signals'] = vaultMan?.['signals'] || {}
    console.log("vaultManSignals: ", vaultManSignals)

    const pulledManJIO = manifestJsonIO(pullDepot, manIder)
    const pulledMan: ObaSyncManifest = pulledManJIO.loaddOnDemand({}).retDepot()
    const pulledUserName = pulledMan?.['meta']?.["userName"] || "JohnDoe"
    const pulledManSignals = pulledMan['signals'] = pulledMan?.['signals'] || {}
    console.log("pulledManSignals: ", pulledManSignals)
    
    // handle issued signals
    let callbackID;
    let eventID: ObaSyncEventID;

    for (const pulledSignalKey in pulledManSignals) {
        console.log("pulledSignalKey: ", pulledSignalKey)

        // signal content
        const pulledSignal: ObaSyncSignal = pulledManSignals[pulledSignalKey]
        const signal1Type = pulledSignal['type']

        // get record
        let vaultSignal = vaultManSignals?.[pulledSignalKey]

        // call context
        const context: ObaSyncCallbackContext = {
            manIder, vaultUserName, pulledUserName, 
            pulledSignalKey, pulledSignal, 
            vaultDepot, pullDepot, pushDepot
        }

        // callback
        if (!vaultSignal) {
            // run callbacks
            eventID = `obasync.vault.signal.missing`
            callbackID = `${eventID}:${signal1Type}`
            await runObaCallbacks(callbackID, {context, eventID})
            eventID = `obasync.vault.signal.ctimetag.missing.or.newer`
            callbackID = `${eventID}:${signal1Type}`
            await runObaCallbacks(callbackID, {context, eventID})
            eventID = `obasync.vault.signal.ctimetag.missing.or.older`
            callbackID = `${eventID}:${signal1Type}`
            await runObaCallbacks(callbackID, {context, eventID})
        }

        const vaultCTimeStampStr = vaultSignal?.['creator.timestamp']
        const pulledCTimeStampStr = pulledSignal?.['creator.timestamp']
        if (vaultCTimeStampStr && pulledCTimeStampStr) {
            const pulledCTimeStamp = new Date(pulledCTimeStampStr)
            const vaultCTimeStamp = new Date(vaultCTimeStampStr)

            // callback
            eventID = `obasync.signals.both.ctimetags.present`
            callbackID = `${eventID}:${signal1Type}`
            await runObaCallbacks(callbackID, {context, eventID})

            // callback
            if (vaultCTimeStamp < pulledCTimeStamp) {
                // mine.newer
                eventID = `obasync.vault.signal.ctimetag.older`
                callbackID = `${eventID}:${signal1Type}`
                await runObaCallbacks(callbackID, {context, eventID})
                eventID = `obasync.vault.signal.ctimetag.missing.or.older`
                callbackID = `${eventID}:${signal1Type}`
                await runObaCallbacks(callbackID, {context, eventID})
            }
            // callback
            if (vaultCTimeStamp == pulledCTimeStamp) {
                // both.equal
                eventID = `obasync.signals.both.ctimetags.equal`
                callbackID = `${eventID}:${signal1Type}`
                await runObaCallbacks(callbackID, {context, eventID})
            }
            // callback
            if (vaultCTimeStamp > pulledCTimeStamp) {
                // both.equal
                eventID = `obasync.vault.signal.ctimetag.newer`
                callbackID = `${eventID}:${signal1Type}`
                await runObaCallbacks(callbackID, {context, eventID})
                eventID = `obasync.vault.signal.ctimetag.missing.or.newer`
                callbackID = `${eventID}:${signal1Type}`
                await runObaCallbacks(callbackID, {context, eventID})
            }
        }

        // callback
        if (!vaultCTimeStampStr && pulledCTimeStampStr) {
            eventID = `obasync.vault.signal.ctimetag.missing`
            callbackID = `${eventID}:${signal1Type}`
            await runObaCallbacks(callbackID, {context, eventID})
        }

            // callback
            if (vaultCTimeStampStr && !pulledCTimeStampStr) {
                eventID = `obasync.pulled.signal.ctimetag.missing`
                callbackID = `${eventID}:${signal1Type}`
                await runObaCallbacks(callbackID, {context, eventID})
            }

        // callback
        if (!vaultCTimeStampStr && !pulledCTimeStampStr) {
            eventID = `obasync.signals.both.ctimetags.missing`
            callbackID = `${eventID}:${signal1Type}`
            await runObaCallbacks(callbackID, {context, eventID})
        }
    } // for (const pulledSignalKey in man1Issued)

}

// MARK: register
export interface SignalHandlerArgs {
    context: ObaSyncCallbackContext, 
    eventID: ObaSyncEventID, 
    task: TaskState
}

type SignalHandlerType = (arg: SignalHandlerArgs) => 
    (HandlingStatus | Promise<HandlingStatus>)


export function registerSignalEventHandler({
    handler,
    handlerName,
    eventID,
    signalType, 
    deltaGas = 1,
    taskIDDigFun = (() => [])
}: {
    handler: SignalHandlerType,
    handlerName: string, 
    eventID: ObaSyncEventID, 
    signalType: string, 
    deltaGas?: number,
    taskIDDigFun?: (context: ObaSyncCallbackContext) => string[]
}) {
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

                    if (status == "handler.ok") {

                        // extract
                        // TODO/ add "issuedBy" into signal
                        // TODO/ add "issuedBy.first" into signal
                        const vaultDepot = context0["vaultDepot"]
                        const pushDepot = context0["pushDepot"]
                        const manIder = context0["manIder"]
                        const pulledSignal = context0["pulledSignal"]

                        const msg = [
                            `Signal processed succesfully`,
                            ` - type: ${pulledSignal["type"]}`,
                            ` - creator.hashKey: ${pulledSignal["creator.hashKey"]}`,
                            ` - creator.name: ${pulledSignal["creator.name"]}`,
                            ` - committer.name: ${pulledSignal["committer.name"]}`,
                            ` - creator.channelName: ${pulledSignal["creator.channelName"]}`,
                            ` - creator.hashKey: ${pulledSignal["creator.hashKey"]}`,
                            ` - creator.timestamp: ${pulledSignal["creator.timestamp"]}`,
                            ` - eventID: ${eventID}`,
                        ].join("\n")
                        new Notice(msg, 1 * 60 * 1000)
                        console.log(msg, 0)

                        
                        const signalTemplate: ObaSyncSignal = {
                            ...pulledSignal,
                            // add handler section
                            // 'handler.name'?: string
                            'handler.name': handlerName,
                            // 'handler.callback'?: string
                            "handler.callback": callbackID,
                            // 'handler.timestamp'?: string,
                            "handler.timestamp": utcTimeTag(),
                            // 'handler.handlingStatus'?: HandlingStatus
                            'handler.handlingStatus': status,
                        }

                        // record signal in vault manifest
                        // TODO/ maybe let the _publishSignal to be optional
                        // await _publishSignal_offline_committed({
                        await _publishSignal_online_committed({
                            vaultDepot,
                            pushDepot,
                            committerName: handlerName,
                            manIder,
                            signalTemplate,
                            hashDig: []
                        })
                        
                    }
                    if (status == "unhandled") {
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
