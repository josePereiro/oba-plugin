// import { copyFileSync, existsSync } from "fs";
// import path from "path";
// import { getNoteObaSyncScope } from "./scope-base";
// import { runObaCallbacks } from "src/services-base/callbacks";
// import { ObaSyncCallbackContext, ObaSyncIssuedSignal, commitObaSyncSignal } from "./signals-base";
// import { _addDummyAndCommit, _justPush, _fetchCheckoutPull } from "./channels-base";
// import { Notice } from "obsidian";
// import { getVaultDir } from "src/tools-base/obsidian-tools";
// import { randstring } from "src/tools-base/utils-tools";


// /*
//     Handle the push of a file
//     - 
// */ 
// export async function _publishFileVersion(
//     localFile: string,
//     channelName: string,
//     userName0: string,
//     channelsConfig: any,
// ) {
//     // context data
//     if (!localFile) { return; }
//     if (!existsSync(localFile)) { return; }
    
//     const localFileName = path.basename(localFile)
//     const scopes = await getNoteObaSyncScope(localFile, channelsConfig) || []
//     const channelConfig = channelsConfig?.[channelName] || {}

//     // check scope
//     const inScope = scopes.contains(channelName)
//     if (!inScope) { 
//         console.log("Note not in scope!");
//         return; 
//     }

//     const pushDepot = channelConfig?.["push.depot"] || null

//     let signal0: ObaSyncIssuedSignal = { 
//         "type": `push`,
//         "fileName": localFileName,
//         "channelName": channelName
//     }

//     runObaCallbacks('obasync.before.push')
//     commitObaSyncSignal(
//         pushDepot, userName0, 'main', signal0, [localFileName],
//         () => {
//             // preV2dPush
            
//             //// r2dPull
//             // _fetchCheckoutPull(pushDepot)
            
//             //// copy
//             const destFile = path.join(pushDepot, localFileName)
//             copyFileSync(localFile, destFile)
//         }, 
//         () => {
//             // postV2dPush
//             //// d2rPush
//             _addDummyAndCommit(pushDepot, randstring())
//             _justPush(pushDepot);
//         }
//     ) 
//     runObaCallbacks('obasync.after.push')
// }

// export async function _downloadFileVersionFromContext(
//     context: ObaSyncCallbackContext,
//     channelsConfig: any,
// ) {

//     const signal = context?.['signal1Content']
//     if (!signal) { return; }
//     const pullDepot = context?.['pullDepot0']
//     const userName0 = context?.['userName0']
//     const userName1 = context?.['userName1']
//     console.log("push.signal: ", signal)
//     console.log("pullDepot: ", pullDepot)
//     const remoteFile = signal?.['fileName']
//     const channelName = signal?.['channelName']
//     const vaultDir = getVaultDir()
//     const channelConfig = channelsConfig?.[channelName] || {}
//     const relpath = channelConfig?.["pull.dest.folder.relpath"] || ''
//     const destDir = path.join(vaultDir, relpath)
//     console.clear()
//     console.log("destDir: ", destDir)
//     const srcPath = path.join(pullDepot, remoteFile)
//     if (!existsSync(srcPath)) {
//         context["handlingStatus"] = 'ok'
//         new Notice(`srcPath missing! ${srcPath}!`)
//         return
//     }
//     const destPath = path.join(destDir, remoteFile)
//     console.log("destDir: ", destDir)
//     console.log("srcPath: ", srcPath)
//     console.log("destPath: ", destPath)
//     copyFileSync(srcPath, destPath)

//     new Notice(`Pulled ${remoteFile} from ${userName1}-${channelName}!`, 10000)
//     context["handlingStatus"] = 'ok'
//     console.log("handle.push.context: ", context)

//     // republish
//     // This is important for multi scoped notes
//     // I need to say to other scopes the note have being changed
//     const scopes = await getNoteObaSyncScope(destPath, channelsConfig)
//     for (const channelName1 of scopes) {
//         if (channelName == channelName1) { continue; }
//         await _publishFileVersion(destPath, channelName1, userName0, channelsConfig)
//     }
// }