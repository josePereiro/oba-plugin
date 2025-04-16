import { existsSync } from "fs";
import { cp, readdir, readFile, rm, stat } from "fs/promises";
import { Notice, TFile } from "obsidian";
import * as path from "path";
import { obaconfig } from "src/oba-base/0-oba-modules";
import { OBA } from "src/oba-base/globals";
import { getCallbackArgs, registerCallback, runCallbacks } from "src/services-base/callbacks";
import { checkEnable, DelayManager, JsonIO, obsidianTools, tools } from "src/tools-base/0-tools-modules";
import { getCurrNote, getCurrNotePath, getNoteYamlHeader, getSelectedText, getVaultDir, resolveNoteAbsPath } from "src/tools-base/obsidian-tools";
import objectHash from 'object-hash';
import { statusbar } from "src/services-base/0-servises-modules";
import { exec } from "child_process";

/*
    Main module to handle syncronization with other vaults
*/

/*
// user1
"https://github.com/josePereiro/TankeFactory-user1-push-repo"
// user2
"https://github.com/josePereiro/TankeFactory-user2-push-repo"
*/

/*
    DOING/ Manifest system
    - send a signal with the las action
    - each action has a timetag
    - a push-action will create a new timetag
    - a pull-action will contain the timetag of a push action
    - or in case of spontaneaous pull, a new timetag
    - a general action-manifest for each user
        - contain a summary
    - a per note action-manifest for each use
        - contain detailed actions for each note
        - it might even contain a log of past actions

    - // TODO, at some point, I can split the depot manifest 
    // in different files, for instance, a file for each first letter of a key.
    // This to avoid loading/writing a big file
*/ 

let ANYMOVE_DELAY: DelayManager = new DelayManager(300, 100, -1, -1) // no delay
let PUSH_DELAY: DelayManager = new DelayManager(3000, 100, 3000, -1)

export function onload() {
    console.log("ObaSync:onload");

    // MARK: commands
    OBA.addCommand({
        id: "oba-obasync-rm-depot-obasync-dir",
        name: "ObaSync rm depot obasync dirs",
        callback: async () => {
            checkEnable("obasync", {err: true, notice: true})
            console.clear()
            const pushDepot = getSyncChannelsConfig("TankeFactory", "push.depot", null)
            const pullDepots = getSyncChannelsConfig("TankeFactory", "pull.depots", [])
            const dirs = [ pushDepot, ...pullDepots ]
            for (const dir of dirs) {
                const obsSyncDir = getObsSyncDir(dir)
                console.log('obsSyncDir: ', obsSyncDir)
                await rm(obsSyncDir, { recursive: true, force: true })
            }
        }
    })

    OBA.addCommand({
        id: "oba-obasync-send-notice-from-selected",
        name: "ObaSync send notice signal from selected",
        callback: async () => {
            checkEnable("obasync", {err: true, notice: true})
            console.clear()
            const sel = getSelectedText()
            if (!sel) {
                new Notice("Nothing selected!")
                return
            }
            const pushDepot = getSyncChannelsConfig("TankeFactory", "push.depot", null)
            const userName0 = obaconfig.getObaConfig("obasync.me", null)
            const signal0: ObaSyncSignal = {
                "type": 'notice',
                "msg": sel 
            }
            sendObaSyncSignal(pushDepot, userName0, 'main', signal0) 
        },
    });

    OBA.addCommand({
        id: "oba-obasync-handle-main-signals",
        name: "ObaSync handle main signals",
        callback: async () => {
            checkEnable("obasync", {err: true, notice: true})
            console.clear()
            const pushDepot = getSyncChannelsConfig("TankeFactory", "push.depot", null)
            const pullDepots = getSyncChannelsConfig("TankeFactory", "pull.depots", [])
            const userName0 = obaconfig.getObaConfig("obasync.me", null)
            for (const pullDepot of pullDepots) {
                await handleSignals(
                    pushDepot, pullDepot, userName0, 'main',
                    () => {
                        // preD2vPull
                        console.log("pulling from: ", pullDepot)
                        _r2dPull(pullDepot)
                    },
                    () => {
                        // postD2vPull
                        console.log("pushing to: ", pushDepot)
                        _d2rPush(pushDepot)
                    }
                ) 
            }
        },
    });

    registerCallback(
        `obasync.signal.missing.in.record0.or.newer:notice`, 
        async () => {
            const context = getCallbackContext()
            if (!context) { return; }
            const sender = context?.["userName1"]
            const msg = context?.['signal1Content']?.['msg']
            // TODO: find a better notification system
            new Notice(`${sender} says: ${msg}!`)
            context["handlingStatus"] = 'ok'
            console.log("handle.notice.context: ", context)
        }
    )
}

// MARK: manifest
function getObsSyncDir(
    depot: string
) {
    return tools.mkSubDir(depot, ".obasync")
}

function remoteManifestFile(
    remoteDir: string, 
    userName: string, 
    manKey: string
) {
    const obasyncDir = getObsSyncDir(remoteDir);
    return path.join(obasyncDir, `${userName}-${manKey}-man.json`)
}

function remoteManifest(
    remoteDir: string, 
    userName: string, 
    manKey: string
) {
    const man = remoteManifestFile(remoteDir, userName, manKey);
    const io = new JsonIO()
    io.file(man)
    return io
}

async function loadAllManifests(
    remoteDir: string,
    manKey: string
) {
    const mans: {[keys: string]: JsonIO} = {} 
    const suffix = `-${manKey}-man.json`
    await tools.readDir(
        remoteDir, 
        {
            walkdown: false,
            onfile: (_path: string) => {
                if (!_path.endsWith(suffix)) { return; }
                const io = new JsonIO()
                io.file(_path)
                const user = io.loadd({}).getd("user", null).retVal()
                if (!user) { return; } 
                mans[user] = io
            },
        } 
    ) 
    return mans
}

function modifyObaSyncManifest(
    depotDir: string,
    userName: string, 
    manKey: string,
    onmod: (manContent: any) => any
) {
    const manIO = remoteManifest(depotDir, userName, manKey)
    manIO.loadd({})
    manIO.withDepot((manContent: any) => {
        // defaults
        manContent["user"] = userName
        manContent["modified.timestamp"] = utcTimeTag()
        onmod(manContent)
    })
    manIO.write()
    return manIO.retDepot()
}

// MARK: signals

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
    const hash = tools.hash64Chain(val0, ...vals)
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

function sendObaSyncSignal(
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
    runCallbacks(`obasync.pre.depot.to.remote.push`)

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

    runCallbacks(`obasync.pre.depot.to.remote.push.2`)
    
    // push depot
    _d2rPush(pushDepotDir)

    postV2dPush()
    runCallbacks(`obasync.post.depot.to.remote.push`)
}

function _d2rPush(
    pushDepotDir: string
) {
    // TODO: use git service
    const command = `cd ${pushDepotDir}; git add .; git commit -m"obasync.pushed!"; git push --all`;
    console.log("command:\n", command);
    exec(command, (error, stdout, stderr) => {
        if (stdout) {
            console.log(`Stdout: ${stdout}`);
        }
        console.log(`Executed: ${command}`);
    });
}

function _r2dPull(
    pullDepotDir: string
) {
    // TODO: use git service
    const command = `cd ${pullDepotDir}; git add .; git fetch --all; git pull`;
    console.log("command:\n", command);
    exec(command, (error, stdout, stderr) => {
        if (stdout) {
            console.log(`Stdout: ${stdout}`);
        }
        console.log(`Executed: ${command}`);
    });
}


function getCallbackContext(): ObaSyncCallbackContext {
    return getCallbackArgs()?.[0]
}
    

async function _runHandlingCallback(
    callbackID: string,
    context: ObaSyncCallbackContext
) {
    // reset status
    context['handlingStatus'] = 'unknown'
    
    // Run callback
    await runCallbacks(callbackID, context)
    
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

/*
    Run the callbacks for each signal event
    - bla0 means something from my manifest
    - bla1 means something from other user manifest
*/ 
async function handleSignals(
    pushDepot: string,
    pullDepot: string,
    userName0: string, 
    manKey: string,
    preD2vPull: (() => any) = () => null,
    postD2vPull: (() => any) = () => null
) {

    // callbacks
    preD2vPull()
    runCallbacks(`obasync.pre.depot.to.vault.pull`)
    
    console.clear()

    const obsSyncDir1 = getObsSyncDir(pullDepot)
    const manIOs = await loadAllManifests(obsSyncDir1, manKey) 
    // get my manifest
    const man0IO = remoteManifest(pushDepot, userName0, manKey)
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
    runCallbacks(`obasync.post.depot.to.vault.pull`)
}

// MARK: Utils
// get universal time
function utcTimeTag() {
    return new Date().toISOString();
}

function getSyncChannelsConfig(
    channelName: string,
    key: string,
    dflt: any = null
) {
    const subVaultsConfig = obaconfig.getObaConfig("obasync.channels", {})
    const subVaultConf = subVaultsConfig?.[channelName] ?? {}
    return subVaultConf?.[key] ?? dflt
}


function getRemotePullDir(
    channelName: string,
    dflt: any = null
) {
    return getSyncChannelsConfig(channelName, "pull.dest.folder.relpath", dflt)
}

function getRemotePath(
    localPath: string, 
    remoteDir: string
) {
    path.join(remoteDir, path.basename(localPath))
}
