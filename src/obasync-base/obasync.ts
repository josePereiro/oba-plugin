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

/*
    Main module to handle syncronization with other vaults
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
        id: "oba-obasync-rm-remote-obasync-dir",
        name: "ObaSync rm remote obasync dir",
        callback: async () => {
            checkEnable("obasync", {err: true, notice: true})
            console.clear()
            const remoteDir = getRemoteDir("TankeFactory")
            const obsSyncDir = remoteObsSyncDir(remoteDir)
            await rm(obsSyncDir, { recursive: true, force: true })
        }
    })

    OBA.addCommand({
        id: "oba-obasync-send-notice-from-selected",
        name: "ObaSync send notice from selected",
        callback: async () => {
            checkEnable("obasync", {err: true, notice: true})
            console.clear()
            const sel = getSelectedText()
            if (!sel) {
                new Notice("Nothing selected!")
                return
            }
            const remoteDir = getRemoteDir("TankeFactory")
            const userName0 = obaconfig.getObaConfig("obasync.me", null)
            const signal0: ObaSyncSignal = {
                "type": 'notice',
                "msg": sel 
            }
            sendObaSyncSignal(remoteDir, userName0, 'main', signal0) 
        },
    });

    OBA.addCommand({
        id: "oba-obasync-handle-main-signals",
        name: "ObaSync handle main signals",
        callback: async () => {
            checkEnable("obasync", {err: true, notice: true})
            console.clear()
            const remoteDir = getRemoteDir("TankeFactory")
            const userName0 = obaconfig.getObaConfig("obasync.me", null)
            await handleSignals(remoteDir, userName0, 'main') 
        },
    });

    OBA.addCommand({
        id: "oba-obasync-push-current-note",
        name: "ObaSync push current note",
        callback: async () => {
            checkEnable("obasync", {err: true, notice: true})
            // TODO
        }
    })


    // MARK: anymove
    // 'changed'
    if (checkEnable("obasync", {err: false, notice: false})) {
        OBA.registerEvent(
            OBA.app.workspace.on('editor-drop', (...args) => {
                runCallbacks('__obasync.obsidian.anymove')
            })
        );
        OBA.registerEvent(
            OBA.app.workspace.on('editor-change', (...args) => {
                runCallbacks('__obasync.obsidian.anymove')
            })
        );
        OBA.registerEvent(
            OBA.app.workspace.on('layout-change', (...args) => {
                runCallbacks('__obasync.obsidian.anymove')
            })
        );
        OBA.registerEvent(
            OBA.app.workspace.on('file-open', (...args) => {
                runCallbacks('__obasync.obsidian.anymove')
            })
        );
        OBA.registerEvent(
            OBA.app.workspace.on('active-leaf-change', (...args) => {
                runCallbacks('__obasync.obsidian.anymove')
            })
        );
        OBA.registerDomEvent(window.document, "wheel", () => {
            runCallbacks('__obasync.obsidian.anymove')
        });
        OBA.registerDomEvent(window.document, "mousemove", () => {
            runCallbacks('__obasync.obsidian.anymove')
        });
        OBA.registerDomEvent(window.document, "click", () => {
            runCallbacks('__obasync.obsidian.anymove')
        });
    
        registerCallback(
            `__obasync.obsidian.anymove`, 
            async () => {
                const now: Date = new Date()
                const flag = await ANYMOVE_DELAY.manageTime()
                if (flag == "go") { 
                    await runCallbacks('obasync.obsidian.anymove')
                }
                
            }
        )

        // push
        OBA.registerDomEvent(window.document, "keyup", async () => {

            console.clear()

            // context data
            const localFile = getCurrNotePath();
            if (!localFile) { return }

            const remoteName = "TankeFactory"
            const remoteDir = getRemoteDir(remoteName)
            const fileName = path.basename(localFile)
            const userName0 = obaconfig.getObaConfig("obasync.me", null)

            //  control flow
            const flag = await PUSH_DELAY
            .manageTime((elapsed) => {
                const conutdown = PUSH_DELAY.delayTime - elapsed
                statusbar.setText(`pushing in: ${conutdown}`)
            })
            if (flag == "notyet") { return }
            statusbar.setText('pushing')

            let signal0: ObaSyncSignal = { 
                "type": `push`,
                "fileName": fileName,
                "remoteName": remoteName
            }

            // push file
            runCallbacks('obasync.before.push')
            const destFile = path.join(remoteDir, fileName)
            cp(localFile, destFile, { force: true })
            sendObaSyncSignal(remoteDir, userName0, 'main', signal0, [fileName]) 
            runCallbacks('obasync.after.push')

            // new Notice("NOTE PUSHED!")
            statusbar.clear()
            statusbar.setText('NOTE PUSHED!', true)
            await sleep(1000)
            statusbar.clear()
        });

        // MARK: send
        // notice
        // OBA.registerEvent(
        //     OBA.app.workspace.on('editor-change', async (editor, info) => {
        //         console.clear()
        //         const activeFile = getCurrNotePath();
        //         if (!activeFile) { return }
        //         const remoteDir = getRemoteDir("TankeFactory")
        //         const userName0 = obaconfig.getObaConfig("obasync.me", null)
        //         let signal0: ObaSyncSignal = { 
        //             "type": 'notice',
        //             "msg": `Im working on '${path.basename(activeFile)}'!!!` 
        //         }
        //         sendObaSyncSignal(remoteDir, userName0, 'main', signal0) 
        //     })
        // );

        
        // MARK: handle
        registerCallback(
            `obasync.obsidian.anymove`, 
            async () => {
                const remoteDir = getRemoteDir("TankeFactory")
                const userName0 = obaconfig.getObaConfig("obasync.me", null)
                await handleSignals(remoteDir, userName0, 'main')
            }
        )

        // pull
        registerCallback(
            `obasync.signal.missing.in.record0.or.newer:push`, 
                async () => {
                    const context = getCallbackContext()
                if (!context) { return; }
                const signal = context?.['signal1Content']
                console.log("push.signal: ", signal)
                const remoteFile = signal?.['fileName']
                const remoteName = signal?.['remoteName']
                const remoteDir = getRemoteDir(remoteName)
                const vaultDir = getVaultDir()

                // "pull.dest.folder.relpath"
                const pullDir = path.join(vaultDir, getRemotePullDir(remoteName, ''))
                console.clear()
                console.log("pullDir: ", pullDir)
                const srcPath = path.join(remoteDir, remoteFile)
                if (!existsSync(srcPath)) {
                    context["handlingStatus"] = 'ok'
                    new Notice(`srcPath missing! ${srcPath}!`)
                    return
                }
                const destPath = path.join(pullDir, remoteFile)
                // if (!existsSync(destPath)) {
                //     context["handlingStatus"] = 'ok'
                //     new Notice(`destPath missing! ${destPath}!`)
                //     return
                // }
                console.log("pullDir: ", pullDir)
                console.log("srcPath: ", srcPath)
                console.log("destPath: ", destPath)
                await cp(srcPath, destPath, { force: true })

                new Notice(`pulled: ${remoteFile}!`)
                context["handlingStatus"] = 'ok'
                console.log("handle.push.context: ", context)
            }
        )

        // registerCallback(
        //     `obasync.signal.missing.in.record0.or.newer:notice`, 
        //     async () => {
        //         const context = getCallbackContext()
        //         if (!context) { return; }
        //         const sender = context?.["userName1"]
        //         const msg = context?.['signal1Content']?.['msg']
        //         // TODO: find a better notification system
        //         new Notice(`${sender} says: ${msg}!`)
        //         context["handlingStatus"] = 'ok'
        //         console.log("handle.notice.context: ", context)
        //     }
        // )

        registerCallback(
            `obasync.signal.missing.in.record0.or.newer:hello.world`, 
            async () => {
                const context = getCallbackContext()
                if (!context) { return; }
                new Notice(`${context?.["userName1"]} says Hello!`)
                context["handlingStatus"] = 'ok'
                console.log("handle.hello.context: ", context)
            }
        )
    }

}

// MARK: manifest

function remoteObsSyncDir(
    remoteDir: string, 
) {
    return tools.getSubDir(remoteDir, ".obasync")
}

function remoteManifestFile(
    remoteDir: string, 
    userName: string, 
    manKey: string
) {
    const obasyncDir = remoteObsSyncDir(remoteDir);
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
    remoteDir: string,
    userName: string, 
    manKey: string,
    onmod: (manContent: any) => any
) {
    const manIO = remoteManifest(remoteDir, userName, manKey)
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
    remoteDir: string,
    userName: string, 
    manKey: string,
    signal: ObaSyncSignal,
    hashDig: string[] = []
) {
    return modifyObaSyncManifest(
        remoteDir,
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
        // console.log(`callback handled, ID:  ${callbackID},  status: ${status}`)
    } else if (status == 'unknown') {
        // console.log(`callback handled, ID:  ${callbackID},  status: ${status}`)
    } else {
        new Notice(`Callback failed, callbackID:  ${callbackID},  status: ${status}`)
    }
}

/*
    Run the callbacks for each signal event
    - bla0 means something from my manifest
    - bla1 means something from other user manifest
*/ 
async function handleSignals(
    remoteDir: string,
    userName0: string, 
    manKey: string,
) {

    const obsSyncDir = remoteObsSyncDir(remoteDir)
    const manIOs = await loadAllManifests(obsSyncDir, manKey) 
    // get my manifest
    const man0IO = manIOs?.[userName0] || remoteManifest(remoteDir, userName0, manKey)
    const man0Records = man0IO.loaddOnDemand({}).getset('records', {}).retVal();
    let callbackID;
    const man0IOContentHash0 = objectHash(
        man0IO.retDepot(), {
            respectType: false, 
            algorithm: 'sha1'   
        }
    )

    // handle others manifest
    for (const userName1 in manIOs) {
        if (userName1 == userName0) { continue } // ignore mine
        
        const man1IO = manIOs[userName1]

        // handle signals
        const man1Signals = man1IO.getd('signals', null).retVal()

        for (const signal1HashKey in man1Signals) {

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
        }
    }

    // write if changed
    const man0IOContentHash1 = objectHash(
        man0IO.retDepot(), {
            respectType: false, 
            algorithm: 'sha1'   
        }
    )
    if (man0IOContentHash0 == man0IOContentHash1) {
        console.log("man0IO unchanged!")
    } else {
        man0IO.write()
    }
}

// MARK: Utils
// get universal time
function utcTimeTag() {
    return new Date().toISOString();
}

function getRemoteConfig(
    remoteName: string,
    key: string,
    dflt: null
) {
    const subVaultsConfig = obaconfig.getObaConfig("obasync.subvaults", {})
    const subVaultConf = subVaultsConfig?.[remoteName] ?? {}
    return subVaultConf?.[key] ?? dflt
}

function getRemoteDir(
    remoteName: string,
    dflt: any = null
) {
    return getRemoteConfig(remoteName, "remote.path", dflt)
}

function getRemotePullDir(
    remoteName: string,
    dflt: any = null
) {
    return getRemoteConfig(remoteName, "pull.dest.folder.relpath", dflt)
}

function getRemotePath(
    localPath: string, 
    remoteDir: string
) {
    path.join(remoteDir, path.basename(localPath))
}
