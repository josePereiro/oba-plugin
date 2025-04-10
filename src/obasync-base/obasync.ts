import { existsSync } from "fs";
import { readdir, readFile, rm, stat } from "fs/promises";
import { Notice, TFile } from "obsidian";
import * as path from "path";
import { obaconfig } from "src/oba-base/0-oba-modules";
import { OBA } from "src/oba-base/globals";
import { obanotes } from "src/onanotes-base/0-obanotes-modules";
import { getCallbackArgs, registerCallback, runCallbacks } from "src/services-base/callbacks";
import { JsonIO, tools } from "src/tools-base/0-tools-modules";
import { getNoteYamlHeader, getSelectedText, getVaultDir, resolveNoteAbsPath } from "src/tools-base/obsidian-tools";



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
            let manContent = sendObaSyncMainSignal({
                remoteDir,
                userName: thisUserName, 
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
            const vaultDir = getVaultDir()
            const remoteDir = getRemoteDir("TankeFactory")
            const thisUserName = obaconfig.getObaConfig("obasync.me", null)
            let signalType = 'hello.world'
            let signalContent = {}
            let manContent = sendObaSyncMainSignal({
                remoteDir,
                userName: thisUserName, 
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
            await handleMainSignals(remoteDir, thisUserName) 
        },
    });


    const handleNotice = async () => {
        console.log(getCallbackArgs())
        const context = getCallbackArgs()?.[0]
        if (!context) { return; }
        console.log("context:\n", context)
        const sender = context?.["userName"]
        const msg = context?.['signalContent']?.['msg']
        // TODO: find a better notification
        new Notice(`${sender} says: ${msg}!`)
    }

    registerCallback(
        `obasync.signal.unrecorded:notice`, 
        async () => {
            await handleNotice()
        }
    )

    registerCallback(
        `obasync.signal.newer:notice`, 
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
    }

    registerCallback(
        `obasync.signal.unrecorded:hello.world`, 
        async () => {
            await handleHello()
        }
    )

    registerCallback(
        `obasync.signal.newer:hello.world`, 
        async () => {
            await handleHello()
        }
    )

}

// MARK: manifest

function remoteObsSyncDir(
    remoteDir: string, 
) {
    return tools.getSubDir(remoteDir, ".obasync")
}

function remoteMainManifestFile(
    remoteDir: string, 
    userName: string, 
) {
    const obasyncDir = remoteObsSyncDir(remoteDir);
    return path.join(obasyncDir, `${userName}-main-man.json`)
}

// TODO, at some point, I can split the depot manifest 
// in different files, for instance, a file for each first letter of a key.
// This to avoid loading/writing a big file
function remoteDepotManifestFile(
    remoteDir: string, 
    userName: string, 
) {
    const obasyncDir = remoteObsSyncDir(remoteDir);
    return path.join(obasyncDir, `${userName}-depot-man.json`)
}

function remoteMainManifest(
    remoteDir: string, 
    userName: string, 
) {
    const man = remoteMainManifestFile(remoteDir, userName);
    const io = new JsonIO()
    io.file(man)
    return io
}

function remoteDepotManifest(
    remoteDir: string, 
    userName: string, 
) {
    const man = remoteDepotManifestFile(remoteDir, userName);
    const io = new JsonIO()
    io.file(man)
    return io
}

async function _loadAllManifests(
    remoteDir: string,
    suffix: string
) {
    const mans: {[keys: string]: JsonIO} = {} 
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

async function loadAllMainManifests(
    remoteDir: string
) {
    return _loadAllManifests(remoteDir, '-main-man.json')
}

async function loadAllDepotManifests(
    remoteDir: string
) {
    return _loadAllManifests(remoteDir, '-depot-man.json')
}

// DOING/ drying this
function modifyObaSyncManifest(
    remoteDir: string,
    userName: string, 
    suffix: '-depot-man.json',
    onmod: (manContent: any) => any
) {
    const manIO = remoteMainManifest(remoteDir, userName)
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


function modifyObaSyncMainManifest(
    remoteDir: string,
    userName: string, 
    onmod: (manContent: any) => any
) {
    const manIO = remoteMainManifest(remoteDir, userName)
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

function modifyObaSyncDepotManifest(
    remoteDir: string,
    userName: string, 
    onmod: (manContent: any) => any
) {
    const manIO = remoteDepotManifest(remoteDir, userName)
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
    signalContent?: any,
    hashDig?: string[]
} 

function _signalHashKey(val0: string, ...vals: string[]) {
    const hash = tools.hash64Chain(val0, ...vals)
    return hash
}

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

function sendObaSyncMainSignal({
    remoteDir,
    userName, 
    signalType, 
    signalContent = {},
    hashDig = []
}: SignalOptions ) {
    return modifyObaSyncMainManifest(
        remoteDir,
        userName, 
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
function sendObaSyncDepotSignal(
    remoteDir: string,
    userName: string, 
    signalType: string, 
    signalContent: any,
    ...hashDig: string[]
) {
    return modifyObaSyncDepotManifest(
        remoteDir,
        userName, 
        (manContent: any) => {
            _writeSignal(
                userName, signalType, manContent, signalContent, hashDig
            ) 
        }
    )
}

/*
    Run the callbacks for each main signal event
*/ 
async function handleMainSignals(
    remoteDir: string,
    thisUserName: string, 
) {
    const obsSyncDir = remoteObsSyncDir(remoteDir)
    const manIOs = await loadAllMainManifests(obsSyncDir) 
    // get my manifest
    const thisManIO = remoteMainManifest(remoteDir, thisUserName);
    const thisMan = thisManIO.loaddOnDemand({}).retDepot()
    console.log('thisMan 0: ', thisMan)
    const thisRecordsContent = thisManIO.getset('records', {}).retVal();
    console.log('thisMan 1: ', thisMan)
    console.log('thisUserName: ', thisUserName)
    console.log('thisRecordsContent: ', thisRecordsContent)

    // handle others manifest
    for (const userName in manIOs) {
        if (userName == thisUserName) { continue } // ignore mine
        
        console.log('userName: ', userName)
        const manIO = manIOs[userName]

        // handle signals
        const signalsContent = manIO.getd('signals', null).retVal()

        for (const hashKey in signalsContent) {
            // console.log('hashKey: ', hashKey)

            // signal content
            const signalContent = signalsContent[hashKey]
            const signalType = signalContent['type']

            // get record
            let thisRecordContent = thisRecordsContent?.[hashKey]

            // obasync.signal.unrecorded
            if (!thisRecordContent) {
                // run callbacks
                const context = {userName, thisUserName, hashKey, signalType, signalContent, thisRecordContent}
                const callbackID = `obasync.signal.unrecorded:${signalType}`
                console.log("running callbackID: ", callbackID)
                // console.log('thisMan 2: ', thisMan)
                await runCallbacks(callbackID, context)
                // console.log('thisMan 3: ', thisMan)
                // update
                // TODO/ Use JsonIO interface
                thisRecordsContent[hashKey] = {
                    ...signalContent,
                    userName,
                    'callback': 'obasync.signal.unrecorded'
                }
                // console.log('thisMan 4: ', thisMan)
                // console.log('thisRecordsContent: ', thisRecordsContent)
            }
            
            // obasync.signal.newer
            const timestampStr = signalContent?.['timestamp']
            const thisTimestampStr = thisRecordContent?.['timestamp']
            if (thisTimestampStr && timestampStr) {
                // console.log('timestampStr: ', timestampStr)
                // console.log('thisTimestampStr: ', thisTimestampStr)
                const timestamp = new Date(timestampStr)
                const thisTimestamp = new Date(thisTimestampStr)
                if (thisTimestamp < timestamp) {
                    const context = {userName, thisUserName, hashKey, signalType, signalContent, thisRecordContent}
                    const callbackID = `obasync.signal.newer:${signalType}`
                    console.log("running callbackID: ", callbackID)
                    await runCallbacks(callbackID, context)
                    // update
                    thisRecordsContent[hashKey] = {
                        ...signalContent,
                        userName,
                        'callback': 'obasync.signal.newer'
                    }
                }
            }
        }
    }

    // console.log('thisMan 5: ', thisMan)
    thisManIO.write()
}

// // Low res

// async function lowResolutionPullOne(
//     srcPath: string,
//     remotePath: string,
//     vaultDir: string,
//     remoteDir: string,
// ) {

//     // Get abstract file by path
//     const remoteYaml = await tools.parseYamlHeaderStream(srcPath)
//     if (!remoteYaml) {
//         new Notice(`Remote: note with missing yaml, note: ${srcPath}`)
//         return;
//     }

//     console.log(remoteYaml)
// }

// /*
//     Pull the newest remote files
// */ 
// async function lowResolutionPullAll(
//     vaultDir: string,
//     remoteDir: string
// ) {

//     // check remote and pull newest notes
//     await tools.readDir(
//         remoteDir, 
//         {
//             walkdown: true,
//             onpath: (_path: string) => {
//             },
//             onfile: async (_path: string) => {
//                 // Process only .md files
//                 if (_path.contains(".trash")) { return; }
//                 if (path.extname(_path).toLowerCase() !== '.md') { return; }
//                 console.log(_path)
//                 await lowResolutionPullOne(_path, vaultDir, remoteDir)
//             },
//             ondir: (_path: string) => {
//             }
//         } 
//     ) 
// }


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

// function pushSubVaultNote(subVault: string) {

//     const subVaultsConfig = obaconfig.getObaConfig("obasync.subvaults", {})
//     console.log(subVaultsConfig)

//     const thisOwner = obaconfig.getObaConfig("obasync.me", null)
//     if (!thisOwner) {
//         new Notice(`obasync.me missing`)
//         return
//     }
//     console.log(`obasync.me ${thisOwner}`)
    
//     const subVaultConf = subVaultsConfig?.[subVault] ?? {}
//     const vaultPath = getVaultDir()
//     const remotePath = subVaultConf?.["remote.path"] ?? ''
//     if (!remotePath) {
//         new Notice(`obasync.subvaults:remote.path is missing`)
//         return
//     }
//     if (!existsSync(remotePath)) {
//         new Notice(`remote folder is missing, remote ${remotePath}`)
//         return
//     }

//     const srcNoteTFiles = obanotes.getObaNotes()
//     for (const srcNoteTFile of srcNoteTFiles) {

//         const srcNotePath = resolveNoteAbsPath(srcNoteTFile)
//         console.log(`srcNotePath: ${srcNotePath}`)
//         const yaml = getNoteYamlHeader(srcNoteTFile)
//         // console.log(yaml)

//         // Get push parameters
//         const noteTimeTagStr = yaml?.['obasync-timetag'] 
//         if (!noteTimeTagStr) {
//             console.log(`obasync-timetag missing, file: ${srcNoteTFile.name}`)
//             continue
//         }
//         const noteTimeTag = new Date(noteTimeTagStr);
//         if (isNaN(noteTimeTag.getTime())) {
//             console.log(`obasync-timetag invalid, file: ${srcNoteTFile.name}, timetag: ${noteTimeTagStr}`)
//             continue
//         }
//         const noteOwner = yaml?.['obasync-owner'] 
//         if (!noteOwner) {
//             console.log(`obasync-owner missing, file: ${srcNoteTFile.name}`)
//             continue
//         }


//         vaultPath
//         remotePath
//         const remoteNoteTFile = getRemoteFilePath(
//             srcNotePath, vaultPath, thisOwner, 
//         )
//         console.log(`remoteNoteTFile: ${remoteNoteTFile}`)
//         continue

//     }

// }

// /*
//     given a note, get its path in the remote
// */ 
// function getRemoteFilePath(
//     localPath: string, 
//     vaultDir: string,
//     vaultOwner: string,
//     noteOwner: string,
//     remoteDir: string,
// ) {
//     const localDirName = path.dirname(localPath)
//     const remoteDirName = localDirName.replace(vaultDir, remoteDir)
//     const localBaseName = path.basename(localPath)
//     let remoteBaseName = localBaseName
//     // Make sure the owner tag is placed
//     if (vaultOwner == noteOwner) {
//         remoteBaseName = remoteBaseName
//             .replace(new RegExp(`^${vaultOwner} - `), '')
//         remoteBaseName = `${vaultOwner} - ${remoteBaseName}`
//     } else {
//         remoteBaseName = remoteBaseName
//             .replace(new RegExp(`^${noteOwner} - `), '')
//             .replace(new RegExp(`^${vaultOwner} - `), '')
//         remoteBaseName = `${noteOwner} - ${remoteBaseName}`
//     }
//     return path.join(remoteDirName, remoteBaseName)
// }
