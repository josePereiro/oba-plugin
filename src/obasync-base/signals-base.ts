import { runObaCallbacks } from "src/services-base/callbacks"
import { getObsSyncDir, utcTimeTag } from "./utils-base"
import { hash64Chain, randstring } from "src/tools-base/utils-tools"
import { Notice } from "obsidian"
import objectHash from "object-hash"
import { manifestFilePath, manifestJsonIO, modifyObaSyncManifest, ObaSyncManifest } from "./manifests-base"
import { _addDummyAndCommit, _resetHard, _clearWD, _fetchCheckoutPull, _justPush } from "./channels-base"
import { copyFileSync } from "fs"

// MARK: base
export interface ObaSyncIssuedSignal {
    "type"?: string,
    "timestamp"?: string,
    "args"?: {[keys: string]: any}
}

type HandlingStatus = "ok" | "unknown" | "error" | null
export interface ObaSyncProcessedSignal {
    "type"?: string,
    "timestamp"?: string,
    "userName0"?: string,
    "callback"?: string
    "handlingStatus"?: HandlingStatus
    "args"?: {[keys: string]: any} 
}

export interface ObaSyncCallbackContext {
    "channelName": string,
    "userName0": string,
    "userName1": string,
    "vaultDepot0": string,
    "pullDepot0": string,
    "pushDepot0": string,
    "signal1HashKey": string,
    "signal1Content": ObaSyncIssuedSignal | null,
    "man0Processed": {[keys: string]: ObaSyncProcessedSignal} | null,
    "handlingStatus": HandlingStatus,
    "args"?: {[keys: string]: any} | null
}

function _signalHashKey(val0: string, ...vals: string[]) {
    const hash = hash64Chain(val0, ...vals)
    return hash
}

interface _setIssuedSignalArgs {
    userName0: string, 
    channelName: string, 
    manContent: ObaSyncManifest, 
    signal: ObaSyncIssuedSignal, 
    hashDig: string[]
}

function _setIssuedSignal({ 
    userName0, 
    channelName, 
    manContent, 
    signal, 
    hashDig
}:_setIssuedSignalArgs ) { 
    manContent['issued.signals'] = manContent?.['issued.signals'] || {}
    signal['type'] = signal?.['type'] || 'obasync.unknown.signal.type'
    signal['timestamp'] = utcTimeTag()
    const hashKey = _signalHashKey(userName0, channelName, signal['type'], ...hashDig)
    manContent['issued.signals'][hashKey] = signal
}

// MARK: commit 
/*
    This is an offline method
*/ 
interface commitObaSyncSignalArgs {
    vaultDepot0: string,
    pushDepot0: string,
    userName0: string, 
    channelName: string,
    manType: string,
    signal0: ObaSyncIssuedSignal,
    hashDig?: string[], 
    callback?: (() => any)
}

export async function commitObaSyncSignal({
    vaultDepot0,
    pushDepot0,
    userName0,
    channelName,
    manType,
    signal0,
    hashDig = [],
    callback = () => null,
}: commitObaSyncSignalArgs ) {

    // i. mod vault manifest
    modifyObaSyncManifest(
        vaultDepot0,
        userName0,
        {channelName, manType}, 
        (manContent: any) => {
            // akn
            _setIssuedSignal({userName0, channelName, manContent, signal: {"type": "obasync.akw.sended"}, hashDig: []})
            // custom
            _setIssuedSignal({userName0, channelName, manContent, signal: signal0, hashDig}) 
            console.log("Signal.sended: ", signal0)
        }
    )
    // ii. setup push depot
    await _addDummyAndCommit(pushDepot0, "pre.copy", "123")

    // iii. callback
    const flag = await callback()
    if (flag == 'abort') { return; }

    // iv. copy vault manifest to push depot
    const srcManFile = manifestFilePath(vaultDepot0, {channelName, manType})
    console.log("srcManFile: ", srcManFile)
    const destManFile = manifestFilePath(pushDepot0, {channelName, manType})
    console.log("destManFile: ", destManFile)
    copyFileSync(srcManFile, destManFile)

    // v. git add/commit
    await _addDummyAndCommit(pushDepot0, "post.copy", "123")

}

// MARK: run
async function _runHandlingCallback(
    callbackID: string,
    directCallback: ((...args: any[]) => any),
    context: ObaSyncCallbackContext,
    {
        onOk = () => null,
        onUnknown = () => null,
        onFailed = () => null
    } : {
        onOk: (() => any),
        onUnknown: (() => any),
        onFailed: (() => any),
    }
) {
    // reset status
    context['handlingStatus'] = 'unknown' as HandlingStatus
    
    // Run callback
    await runObaCallbacks(callbackID, context)
    await directCallback(callbackID, context)

    // Validate run
    // const context = {userName0, userName1, signal1HashKey, signal1Content, man0Processed, handlingStatus: 'unknown'}
    const man0Processed = context["man0Processed"]
    const hashKey = context["signal1HashKey"]
    const signal1: ObaSyncIssuedSignal = context["signal1Content"]
    const userName1 = context["userName1"]
    const status = context['handlingStatus']

    if (status == 'ok') {
        man0Processed[hashKey] = {
            ...signal1,
            'userName0': userName1,
            'callback': 'obasync.signal.missing.in.record0',
            'handlingStatus': status
        } as ObaSyncProcessedSignal
        console.log(`Callback handled, callbackID:  ${callbackID},  status: ${status}`)
        await onOk()
    } else if (status == 'unknown') {
        console.warn(`Unknown status, callbackID:  ${callbackID}`)
        await onUnknown()
    } else {
        const msg = `Callback failed, callbackID:  ${callbackID},  status: ${status}`
        console.error(msg)
        new Notice(msg)
        await onFailed()
    }
}

// MARK: process
/*
    Run the callbacks for each signal event
    - bla0 means something from my manifest
    - bla1 means something from other user manifest
    This is an offline method
*/ 

interface processObaSyncSignalsArgs {
    vaultDepot0: string,
    pushDepot0: string,
    pullDepot0: string,
    userName0: string, 
    channelName: string, 
    manType: string,
    onCallback?: ((callbackID: string, context: ObaSyncCallbackContext) => any),
    onOk?: (() => any),
    onUnknown?: (() => any),
    onFailed?: (() => any),
}

export async function processObaSyncSignals({
    vaultDepot0,
    pushDepot0,
    pullDepot0,
    userName0, 
    channelName, 
    manType,
    onCallback = (...args) => null,
    onOk = () => null,
    onUnknown = () => null,
    onFailed =() => null,
}: processObaSyncSignalsArgs) {

    // pull pullDepot0
    await _resetHard(pullDepot0)

    // load manifests
    const man0IO = manifestJsonIO(vaultDepot0, { channelName, manType })
    const man0: ObaSyncManifest = man0IO.loaddOnDemand({}).retDepot()
    const man0Processed = man0['processed.signals'] = man0?.['processed.signals'] || {}
    const man0IOContentHash0 = objectHash(man0, {respectType: false, algorithm: 'sha1'})
    console.log("man0IOContentHash0: ", man0IOContentHash0)

    const man1IO = manifestJsonIO(pullDepot0, { channelName, manType })
    const man1: ObaSyncManifest = man1IO.loaddOnDemand({}).retDepot()
    const userName1 = man1?.['meta']?.["userName"] || "JohnDoe"
    const man1Issued = man1['issued.signals'] = man1?.['issued.signals'] || {}
    console.log("man1Issued: ", man1Issued)
    
    // handle issued signals
    let callbackID;

    for (const signal1HashKey in man1Issued) {
        console.log("signal1HashKey: ", signal1HashKey)

        // signal content
        const signal1Content: ObaSyncIssuedSignal = man1Issued[signal1HashKey]
        const signal1Type = signal1Content['type']

        // get record
        let man0Record = man0Processed?.[signal1HashKey]

        // call context
        const context: ObaSyncCallbackContext = {
            channelName, 
            userName0, userName1, 
            signal1HashKey, signal1Content, 
            man0Processed, 
            vaultDepot0, pullDepot0, pushDepot0,
            handlingStatus: 'unknown'
        }

        // callback
        if (!man0Record) {
            // run callbacks
            callbackID = `obasync.signal.missing.in.record0:${signal1Type}`
            await _runHandlingCallback(callbackID, onCallback, context, { onOk, onUnknown, onFailed })
            callbackID = `obasync.signal.missing.in.record0.or.newer:${signal1Type}`
            await _runHandlingCallback(callbackID, onCallback, context, { onOk, onUnknown, onFailed })
        }

        const timestamp1Str = signal1Content?.['timestamp']
        const timestamp0Str = man0Record?.['timestamp']
        if (timestamp0Str && timestamp1Str) {
            const timestamp1 = new Date(timestamp1Str)
            const timestamp0 = new Date(timestamp0Str)

            // callback
            callbackID = `obasync.signal.timetags.both.present:${signal1Type}`
            await _runHandlingCallback(callbackID, onCallback, context, { onOk, onUnknown, onFailed })

            // callback
            if (timestamp0 < timestamp1) {
                // mine.newer
                callbackID = `obasync.signal.timetag0.newer:${signal1Type}`
                await _runHandlingCallback(callbackID, onCallback, context, { onOk, onUnknown,  onFailed })
                callbackID = `obasync.signal.missing.in.record0.or.newer:${signal1Type}`
                await _runHandlingCallback(callbackID, onCallback, context, { onOk, onUnknown,  onFailed })
            }
            // callback
            if (timestamp0 == timestamp1) {
                // both.equal
                callbackID = `obasync.signal.timetags.both.equal:${signal1Type}`
                await _runHandlingCallback(callbackID, onCallback, context, { onOk, onUnknown,  onFailed })
            }
            // callback
            if (timestamp0 > timestamp1) {
                // both.equal
                callbackID = `obasync.signal.timetag0.older:${signal1Type}`
                await _runHandlingCallback(callbackID, onCallback, context, { onOk, onUnknown,  onFailed })
            }
        }

        // callback
        if (!timestamp0Str && timestamp1Str) {
            callbackID = `obasync.signal.timetag0.missing:${signal1Type}`
            await _runHandlingCallback(callbackID, onCallback, context, { onOk, onUnknown, onFailed })
        }

            // callback
            if (timestamp0Str && !timestamp1Str) {
                callbackID = `obasync.signal.timetag1.missing:${signal1Type}`
                await _runHandlingCallback(callbackID, onCallback, context, { onOk, onUnknown,  onFailed })
            }

        // callback
        if (!timestamp0Str && !timestamp1Str) {
            callbackID = `obasync.signal.timetags.both.missing:${signal1Type}`
            await _runHandlingCallback(callbackID, onCallback, context, { onOk, onUnknown, onFailed })
        }
    } // for (const signal1HashKey in man1Issued)

    // check modified
    const man0IOContentHash1 = objectHash(man0, { respectType: false, algorithm: 'sha1' })
    console.log("man0IOContentHash1: ", man0IOContentHash1)
    const modified = man0IOContentHash0 != man0IOContentHash1
    if (!modified) {
        console.log("man0 unchanged!")
        return
    } 
    
    // write vault
    man0IO.write()

    // sync to pushDepot
    // setup push depot
    // TODO/ add lock system
    await _resetHard(pushDepot0)

    // copy vault manifest to push depot
    const srcManFile = manifestFilePath(vaultDepot0, { channelName, manType })
    const destManFile = manifestFilePath(pushDepot0, { channelName, manType })
    copyFileSync(srcManFile, destManFile)

    // git add/commit
    await _addDummyAndCommit(pushDepot0, "signal.resolved", "123")
}
