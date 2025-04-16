
import { runObaCallbacks } from "src/services-base/callbacks"
import { getObsSyncDir, utcTimeTag } from "./utils-base"
import { hash64Chain } from "src/tools-base/utils-tools"
import { Notice } from "obsidian"
import objectHash from "object-hash"
import { loadAllManifestIOs, modifyObaSyncManifest, remoteManifestIO } from "./manifests-base"
import { _d2rPush } from "./channels-base"

// MARK: base
export interface ObaSyncSignal {
    "type"?: string,
    "timtetag"?: string,
    [keys: string]: any
}

export interface ObaSyncRecord {
    "type"?: string,
    "timtetag"?: string,
    "userName": string,
    "callback": string
    "handlingStatus": string
    [keys: string]: any
}

export interface ObaSyncCallbackContext {
    "userName0": string,
    "userName1": string,
    "signal1HashKey": string,
    "signal1Content": {[keys: string]: any} | null,
    "man0Records": {[keys: string]: any} | null,
    "handlingStatus": string | null,
    [keys: string]: any
}

function _signalHashKey(val0: string, ...vals: string[]) {
    const hash = hash64Chain(val0, ...vals)
    return hash
}

function _writeSignal(
    userName: string, 
    manContent: any, 
    signal: ObaSyncSignal, 
    hashDig: string[]
) { 
    manContent['signals'] = manContent?.['signals'] || {}
    signal['type'] = signal?.['type'] || 'obasync.unknown'
    signal['timestamp'] = utcTimeTag()
    const hashKey = _signalHashKey(userName, signal['type'], ...hashDig)
    manContent['signals'][hashKey] = signal
}

// MARK: send
export function sendObaSyncSignal(
    pushDepotDir: string,
    userName: string, 
    manKey: string,
    signal: ObaSyncSignal,
    hashDig: string[] = [], 
    preV2dPush: (() => any) = () => null,
    postV2dPush: (() => any) = () => null,
) {

    // run callbacks
    preV2dPush()
    runObaCallbacks(`obasync.pre.depot.to.remote.push`)

    // push signal to depot
    modifyObaSyncManifest(
        pushDepotDir,
        userName, 
        manKey,
        (manContent: any) => {
            // akn
            _writeSignal(userName, manContent, {"type": "obasync.akw.sended"}, [])
            // custom
            _writeSignal(userName, manContent, signal, hashDig) 
            console.log("Signal.sended: ", signal)
        }
    )

    runObaCallbacks(`obasync.pre.depot.to.remote.push.2`)
    
    // push depot
    _d2rPush(pushDepotDir)

    postV2dPush()
    runObaCallbacks(`obasync.post.depot.to.remote.push`)
}

// MARK: run
async function _runHandlingCallback(
    callbackID: string,
    context: ObaSyncCallbackContext
) {
    // reset status
    context['handlingStatus'] = 'unknown'
    
    // Run callback
    await runObaCallbacks(callbackID, context)
    
    // Validate run
    // const context = {userName0, userName1, signal1HashKey, signal1Content, man0Records, handlingStatus: 'unknown'}
    const man0Records = context["man0Records"]
    const hashKey = context["signal1HashKey"]
    const signal1: ObaSyncSignal = context["signal1Content"]
    const userName1 = context["userName1"]
    const status = context['handlingStatus']

    if (status == 'ok') {
        man0Records[hashKey] = {
            ...signal1,
            'userName': userName1,
            'callback': 'obasync.signal.missing.in.record0',
            'handlingStatus': status
        } as ObaSyncRecord
        console.log(`Callback handled, callbackID:  ${callbackID},  status: ${status}`)
    } else if (status == 'unknown') {
        console.warn(`Unknown status, callbackID:  ${callbackID}`)
    } else {
        const msg = `Callback failed, callbackID:  ${callbackID},  status: ${status}`
        console.error(msg)
        new Notice(msg)
    }
}

// MARK: handle
/*
    Run the callbacks for each signal event
    - bla0 means something from my manifest
    - bla1 means something from other user manifest
*/ 
export async function handleObaSyncSignals(
    pushDepot: string,
    pullDepot: string,
    userName0: string, 
    manKey: string,
    preD2vPull: (() => any) = () => null,
    postD2vPull: (() => any) = () => null
) {

    // callbacks
    preD2vPull()
    runObaCallbacks(`obasync.pre.depot.to.vault.pull`)
    
    console.clear()

    const obsSyncDir1 = getObsSyncDir(pullDepot)
    const manIOs = await loadAllManifestIOs(obsSyncDir1, manKey) 
    // get my manifest
    const man0IO = remoteManifestIO(pushDepot, userName0, manKey)
    console.log("manIO: ", man0IO)
    const man0Records = man0IO.loaddOnDemand({}).getset('records', {}).retVal();
    let callbackID;
    const man0IOContentHash0 = objectHash(
        man0IO.retDepot(), {
            respectType: false, 
            algorithm: 'sha1'   
        }
    )
    console.log("man0IOContentHash0: ", man0IOContentHash0)

    // handle others manifest
    console.log("userName0: ", userName0)
    for (const userName1 in manIOs) {
        console.log("userName1: ", userName1)
        if (userName1 == userName0) { continue } // ignore mine
        
        const man1IO = manIOs[userName1]

        // handle signals
        const man1Signals = man1IO.getd('signals', {}).retVal()

        for (const signal1HashKey in man1Signals) {
            console.log("signal1HashKey: ", signal1HashKey)

            // signal content
            const signal1Content = man1Signals[signal1HashKey]
            const signal1Type = signal1Content['type']

            // get record
            let man0Record = man0Records?.[signal1HashKey]

            // call context
            const context: ObaSyncCallbackContext = {
                userName0, userName1, 
                signal1HashKey, signal1Content, 
                man0Records, 
                handlingStatus: 'unknown'
            }

            // callback
            if (!man0Record) {
                // run callbacks
                callbackID = `obasync.signal.missing.in.record0:${signal1Type}`
                await _runHandlingCallback(callbackID, context)
                callbackID = `obasync.signal.missing.in.record0.or.newer:${signal1Type}`
                await _runHandlingCallback(callbackID, context)
            }

            const timestamp1Str = signal1Content?.['timestamp']
            const timestamp0Str = man0Record?.['timestamp']
            if (timestamp0Str && timestamp1Str) {
                const timestamp1 = new Date(timestamp1Str)
                const timestamp0 = new Date(timestamp0Str)

                // callback
                callbackID = `obasync.signal.timetags.both.present:${signal1Type}`
                await _runHandlingCallback(callbackID, context)

                // callback
                if (timestamp0 < timestamp1) {
                    // mine.newer
                    callbackID = `obasync.signal.timetag0.newer:${signal1Type}`
                    await _runHandlingCallback(callbackID, context)
                    callbackID = `obasync.signal.missing.in.record0.or.newer:${signal1Type}`
                    await _runHandlingCallback(callbackID, context)
                }
                // callback
                if (timestamp0 == timestamp1) {
                    // both.equal
                    callbackID = `obasync.signal.timetags.both.equal:${signal1Type}`
                    await _runHandlingCallback(callbackID, context)
                }
                // callback
                if (timestamp0 > timestamp1) {
                    // both.equal
                    callbackID = `obasync.signal.timetag0.older:${signal1Type}`
                    await _runHandlingCallback(callbackID, context)
                }
            }

            // callback
            if (!timestamp0Str && timestamp1Str) {
                callbackID = `obasync.signal.timetag0.missing:${signal1Type}`
                await _runHandlingCallback(callbackID, context)
            }

                // callback
                if (timestamp0Str && !timestamp1Str) {
                    callbackID = `obasync.signal.timetag1.missing:${signal1Type}`
                    await _runHandlingCallback(callbackID, context)
                }

            // callback
            if (!timestamp0Str && !timestamp1Str) {
                callbackID = `obasync.signal.timetags.both.missing:${signal1Type}`
                await _runHandlingCallback(callbackID, context)
            }
        } // for (const signal1HashKey in man1Signals)
    }

    // write if changed
    const man0IOContentHash1 = objectHash(
        man0IO.retDepot(), {
            respectType: false, 
            algorithm: 'sha1'   
        }
    )
    console.log("man0IOContentHash1: ", man0IOContentHash1)
    if (man0IOContentHash0 == man0IOContentHash1) {
        console.log("man0IO unchanged!")
    } else {
        man0IO.write()
    }

    postD2vPull()
    runObaCallbacks(`obasync.post.depot.to.vault.pull`)
}
