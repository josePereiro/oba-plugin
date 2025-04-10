import { existsSync } from "fs";
import { readdir, readFile, rm, stat } from "fs/promises";
import { Notice, TFile } from "obsidian";
import * as path from "path";
import { obaconfig } from "src/oba-base/0-oba-modules";
import { OBA } from "src/oba-base/globals";
import { getCallbackArgs, registerCallback, runCallbacks } from "src/services-base/callbacks";
import { JsonIO, tools } from "src/tools-base/0-tools-modules";
import { getCurrNote, getCurrNotePath, getNoteYamlHeader, getSelectedText, getVaultDir, resolveNoteAbsPath } from "src/tools-base/obsidian-tools";


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


export function onload() {
    console.log("ObaSync:onload");

    OBA.addCommand({
        id: "oba-obasync-rm-remote-obasync-dir",
        name: "ObaSync rm remote obasync dir",
        callback: async () => {
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
            console.clear()
            const sel = getSelectedText()
            if (!sel) {
                new Notice("Nothing selected!")
                return
            }
            const remoteDir = getRemoteDir("TankeFactory")
            const thisUserName = obaconfig.getObaConfig("obasync.me", null)
            let signalType = 'notice'
            let signalContent = { "msg": sel }
            let manContent = sendObaSyncSignal({
                remoteDir,
                userName: thisUserName, 
                manKey: 'main',
                signalType,
                signalContent,
            }) 
            console.log(manContent)
        },
    });

    OBA.addCommand({
        id: "oba-obasync-dev",
        name: "ObaSync Dev",
        callback: async () => {
            console.clear()
            const remoteDir = getRemoteDir("TankeFactory")
            const thisUserName = obaconfig.getObaConfig("obasync.me", null)
            let signalType = 'hello.world'
            let signalContent = {}
            let manContent = sendObaSyncSignal({
                remoteDir,
                userName: thisUserName, 
                manKey: 'main',
                signalType,
                signalContent,
            }) 
            console.log(manContent)
        },
    });

    OBA.addCommand({
        id: "oba-obasync-handle-main-signals",
        name: "ObaSync handle main signals",
        callback: async () => {
            console.clear()
            const remoteDir = getRemoteDir("TankeFactory")
            const thisUserName = obaconfig.getObaConfig("obasync.me", null)
            await handleSignals(remoteDir, thisUserName, 'main') 
        },
    });

    registerCallback(
        `oba-interval-1`, 
        async () => {
            const remoteDir = getRemoteDir("TankeFactory")
            const thisUserName = obaconfig.getObaConfig("obasync.me", null)
            await handleSignals(remoteDir, thisUserName, 'main') 
        }
    )

    const handleNotice = async () => {
        console.log(getCallbackArgs())
        const context = getCallbackArgs()?.[0]
        if (!context) { return; }
        console.log("context:\n", context)
        const sender = context?.["userName"]
        const msg = context?.['signalContent']?.['msg']
        // TODO: find a better notification
        new Notice(`${sender} says: ${msg}!`)
        context["handlingStatus"] = 'ok'
    }

    registerCallback(
        `obasync.signal.unrecorded:notice`, 
        async () => {
            await handleNotice()
        }
    )

    registerCallback(
        `obasync.signal.timetag.mine.newer:notice`, 
        async () => {
            await handleNotice()
        }
    )

    const handleHello = async () => {
        console.log(getCallbackArgs())
        const context = getCallbackArgs()?.[0]
        if (!context) { return; }
        console.log("context:\n", context)
        new Notice(`${context?.["userName"]} says Hello!`)
        context["handlingStatus"] = 'ok'
    }

    registerCallback(
        `obasync.signal.unrecorded:hello.world`, 
        async () => {
            await handleHello()
        }
    )

    registerCallback(
        `obasync.signal.timetag.mine.newer:hello.world`, 
        async () => {
            await handleHello()
        }
    )

    // 'changed'
    OBA.registerEvent(
        OBA.app.workspace.on('editor-change', (editor, info) => {
            const activeFile = getCurrNotePath();
            if (!activeFile) { return }
            console.clear()
            const remoteDir = getRemoteDir("TankeFactory")
            const thisUserName = obaconfig.getObaConfig("obasync.me", null)
            let signalType = 'notice'
            let signalContent = { "msg": 
                `${thisUserName} is working on ${path.basename(activeFile)}!!!` 
            }
            let manContent = sendObaSyncSignal({
                remoteDir,
                userName: thisUserName, 
                manKey: 'main',
                signalType,
                signalContent,
            }) 
            console.log(manContent)
        })
    );

    OBA.registerEvent(
        OBA.app.workspace.on('editor-change', async (editor, info) => {
            const activeFile = getCurrNotePath();
            if (!activeFile) { return }
            const remoteDir = getRemoteDir("TankeFactory")
            const thisUserName = obaconfig.getObaConfig("obasync.me", null)
            await handleSignals(remoteDir, thisUserName, 'main') 
        })
    );

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
                console.log(_path)
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

export interface SignalOptions {
    remoteDir: string,
    userName: string, 
    signalType: string, 
    manKey: string,
    signalContent?: any,
    hashDig?: string[]
} 

function _signalHashKey(val0: string, ...vals: string[]) {
    const hash = tools.hash64Chain(val0, ...vals)
    return hash
}

/*
{
    "signals": {
        "adasdf6546sad5f65": {
            "signalType": "hello",
            "timestamp": "2025-04-10T14:30:00.000Z"
        }
    }
}
*/ 
function _writeSignal(
    userName: string, 
    signalType: string, 
    manContent: any, 
    signalContent: any, 
    hashDig: string[]
) {
    manContent['signals'] = manContent?.['signals'] || {}
    signalContent['type'] = signalType
    signalContent['timestamp'] = utcTimeTag()
    const hashKey = _signalHashKey(userName, signalType, ...hashDig)
    manContent['signals'][hashKey] = signalContent
}

function sendObaSyncSignal({
    remoteDir,
    userName, 
    signalType, 
    manKey,
    signalContent = {},
    hashDig = []
}: SignalOptions ) {
    return modifyObaSyncManifest(
        remoteDir,
        userName, 
        manKey,
        (manContent: any) => {
            // akn
            _writeSignal(userName, "signal.sended", manContent, {}, [])
            // custom
            _writeSignal(
                userName, signalType, manContent, signalContent, hashDig
            ) 
        }
    )
}


async function _runHandlingCallback(
    callbackID: string,
    context: any
) {
    // reset status
    context['handlingStatus'] = 'unknown'

    // Run callback
    await runCallbacks(callbackID, context)
    
    // Validate run
    const thisRecordsContent = context["thisRecordsContent"]
    const hashKey = context["hashKey"]
    const signalContent = context["signalContent"]
    const userName = context["userName"]
    const status = context['handlingStatus']
    if (status == 'ok') {
        thisRecordsContent[hashKey] = {
            ...signalContent,
            userName,
            'callback': 'obasync.signal.unrecorded',
            'handlingStatus': status
        }
    } else if (status == 'unknown') {
        console.log(`Unknown status, callbackID:  ${callbackID},  status: ${status}`)
    } else {
        new Notice(`Callback failed, callbackID:  ${callbackID},  status: ${status}`)
    }
}

/*
    Run the callbacks for each signal event
*/ 
async function handleSignals(
    remoteDir: string,
    thisUserName: string, 
    manKey: string,
) {

    const obsSyncDir = remoteObsSyncDir(remoteDir)
    const manIOs = await loadAllManifests(obsSyncDir, manKey) 
    // get my manifest
    const thisManIO = remoteManifest(remoteDir, thisUserName, manKey);
    const thisRecordsContent = thisManIO.loadd({}).getset('records', {}).retVal();

    // handle others manifest
    for (const userName in manIOs) {
        if (userName == thisUserName) { continue } // ignore mine
        
        console.log('userName: ', userName)
        const manIO = manIOs[userName]

        // handle signals
        const signalsContent = manIO.getd('signals', null).retVal()

        for (const hashKey in signalsContent) {

            // signal content
            const signalContent = signalsContent[hashKey]
            const signalType = signalContent['type']

            // get record
            let thisRecordContent = thisRecordsContent?.[hashKey]

            // call context
            const context = {userName, thisUserName, hashKey, signalType, signalContent, thisRecordContent, thisRecordsContent, handlingStatus: 'unknown'}
            console.log('context: ', context)

            // obasync.signal.unrecorded
            if (!thisRecordContent) {
                // run callbacks
                const callbackID = `obasync.signal.unrecorded:${signalType}`
                console.log("running callbackID: ", callbackID)
                await _runHandlingCallback(callbackID, context)
            }

            const timestampStr = signalContent?.['timestamp']
            const thisTimestampStr = thisRecordContent?.['timestamp']
            if (thisTimestampStr && timestampStr) {
                const timestamp = new Date(timestampStr)
                const thisTimestamp = new Date(thisTimestampStr)

                // both.present
                const callbackID = `obasync.signal.timetag.both.present:${signalType}`
                console.log("running callbackID: ", callbackID)
                await _runHandlingCallback(callbackID, context)

                if (thisTimestamp < timestamp) {
                    // mine.newer
                    const callbackID = `obasync.signal.timetag.mine.newer:${signalType}`
                    console.log("running callbackID: ", callbackID)
                    await _runHandlingCallback(callbackID, context)
                }
                if (thisTimestamp == timestamp) {
                    // both.equal
                    const callbackID = `obasync.signal.timetag.both.equal:${signalType}`
                    console.log("running callbackID: ", callbackID)
                    await _runHandlingCallback(callbackID, context)
                }
                if (thisTimestamp > timestamp) {
                    // both.equal
                    const callbackID = `obasync.signal.timetag.mine.older:${signalType}`
                    console.log("running callbackID: ", callbackID)
                    await _runHandlingCallback(callbackID, context)
                }
            }

            // obasync.signal.timetag.mine.missing
            if (thisTimestampStr && !timestampStr) {
                const callbackID = `obasync.signal.timetag.mine.missing:${signalType}`
                console.log("running callbackID: ", callbackID)
                await _runHandlingCallback(callbackID, context)
            }

            // obasync.signal.timetag.other.missing
            if (!thisTimestampStr && timestampStr) {
                const callbackID = `obasync.signal.timetag.other.missing:${signalType}`
                console.log("running callbackID: ", callbackID)
                await _runHandlingCallback(callbackID, context)
            }

            // obasync.signal.timetag.both.mising
            if (!thisTimestampStr && !timestampStr) {
                const callbackID = `obasync.signal.timetag.both.missing:${signalType}`
                console.log("running callbackID: ", callbackID)
                await _runHandlingCallback(callbackID, context)
            }
        }
    }

    thisManIO.write()
}

// // Utils
// get universal time
function utcTimeTag() {
    return new Date().toISOString();
}

function getRemoteDir(
    remoteName: string
) {
    const subVaultsConfig = obaconfig.getObaConfig("obasync.subvaults", {})
    const subVaultConf = subVaultsConfig?.[remoteName] ?? {}
    const remotePath = subVaultConf?.["remote.path"] ?? ''
    return remotePath
}

