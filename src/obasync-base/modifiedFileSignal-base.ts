// import { copyFileSync, existsSync, statSync } from "fs";
// import { Notice } from "obsidian";
// import path from "path";
// import { getObaConfig } from "src/oba-base/obaconfig";
// import { getVaultDir } from "src/tools-base/obsidian-tools";
// import { ObaSyncManifestIder } from "./manifests-base";
// import { getNoteObaSyncScope } from "./scope-base";
// import { HandlingStatus, ObaSyncCallbackContext, ObaSyncPublishControlArgs, ObaSyncSignal, publishSignal } from "./signals-base";

// const PulledMTimeReg = {} as {[keys: string]: number}

// // MARK: publishModifiedFileSignal
// export async function publishModifiedFileSignal({
//     vaultFile,
//     manIder,
//     committerName,
//     channelsConfig,
//     controlArgs,
//     checkPulledMTime,
//     signalTemplate = null,
// } : {
//     vaultFile: string,
//     manIder: ObaSyncManifestIder,
//     committerName: string,
//     channelsConfig: any,
//     controlArgs: ObaSyncPublishControlArgs,
//     checkPulledMTime: boolean
//     signalTemplate?: ObaSyncSignal | null,
// }): Promise<HandlingStatus> {

//     console.log("--------------------------")
//     console.log("publishModifiedFileSignal")

//     // context data
//     if (!vaultFile) { 
//         console.error("Null vaultFile!");
//         return "error"; 
//     }
//     if (!existsSync(vaultFile)) { 
//         console.error("Missing vaultFile!");
//         return "error"; 
//     }

//     // check last pulled
//     const { channelName } = manIder
//     if (checkPulledMTime) {
//         const pulledKey = `${channelName}:${vaultFile}`
//         const currMTime = statSync(vaultFile).mtimeMs
//         const regMTime = PulledMTimeReg?.[pulledKey] || -1
//         if (currMTime == regMTime) {
//             new Notice(`Ignored: currMTime == regMTime, ${pulledKey}`)
//             console.log(`Ignored: currMTime == regMTime, ${pulledKey}`)
//             return;
//         }
//         if (currMTime < regMTime) {
//             console.error(`Ignored: currMTime < regMTime, ${pulledKey}`)
//             new Notice(`Ignored: currMTime < regMTime, ${pulledKey}`)
//             return;
//         }
//         if (currMTime > regMTime) {
//             console.error(`Go: currMTime > regMTime, ${pulledKey}`)
//             new Notice(`Go: currMTime > regMTime, ${pulledKey}`)
//         }
//     }
    
//     const scopes = await getNoteObaSyncScope(vaultFile, channelsConfig) || []

//     // check scope
//     const inScope = scopes.contains(channelName)
//     if (!inScope) { 
//         console.error("Note not in scope!");
//         return "error"; 
//     }
    
//     const localFileName = path.basename(vaultFile)
//     const channelConfig = channelsConfig?.[channelName] || {}
//     const pushDepot = channelConfig?.["push.depot"] || null
//     const vaultDepot = getVaultDir()

//     signalTemplate = signalTemplate 
//         || { 
//             "type": 'modified.file', 
//             "args": {
//                 "targetFileName": localFileName,
//             }
//         }

//     const signal = await publishSignal({
//         vaultDepot,
//         pushDepot,
//         committerName,
//         manIder,
//         signalTemplate,
//         hashDig: [localFileName], 
//         callback: () => {
//             // copy file
//             const pushRepoPath = path.join(pushDepot, localFileName)
//             copyFileSync(vaultFile, pushRepoPath)
//             console.log(`Copied ${vaultFile} -> ${pushRepoPath}`)
//         },
//         ...controlArgs
//     })
//     if (!signal) { 
//         console.error("!signal == true");
//         return "error"; 
//     }
    
//     return "handler.ok"
// }


// // MARK: _handleDownloadFile
// // TODO/ rename
// export async function _handleDownloadFile({
//     context,
//     channelsConfig,
//     controlArgs
// }: {
//     context: ObaSyncCallbackContext,
//     channelsConfig: any,
//     controlArgs: ObaSyncPublishControlArgs
// }): Promise<HandlingStatus> {

//     console.log("--------------------------")
//     console.log("_handleDownloadFile")

//     const pulledSignal = context['pulledSignal']
//     if (!pulledSignal) { return; }
//     const pullDepot = context['pullDepot']
//     const vaultUserName = context['vaultUserName']
//     const pulledUserName = context['pulledUserName']
//     console.log("_handleDownloadFile:pulledSignal: ", pulledSignal)
//     console.log("_handleDownloadFile:pullDepot: ", pullDepot)
//     const targetFileName = pulledSignal?.["args"]['targetFileName']
//     const channelName = context["manIder"]["channelName"]
//     const vaultDir = getVaultDir()
//     const relpath = getObaConfig("obanotes.notes.root.relpath", '')
//     const destDir = path.join(vaultDir, relpath)
//     const manType = context["manIder"]["manType"]

//     // console.clear()
//     console.log("_handleDownloadFile:destDir: ", destDir)
//     const pullRepoFile = path.join(pullDepot, targetFileName)
//     if (!existsSync(pullRepoFile)) {
//         new Notice(`pullRepoFile missing! ${pullRepoFile}!`)
//         return "error"
//     }
//     const vaultFile = path.join(destDir, targetFileName)
//     console.log("_handleDownloadFile:pullRepoFile: ", pullRepoFile)
//     console.log("_handleDownloadFile:vaultFile: ", vaultFile)
    
//     copyFileSync(pullRepoFile, vaultFile)
//     const pulledKey = `${channelName}:${vaultFile}`
//     PulledMTimeReg[pulledKey] = statSync(vaultFile).mtimeMs
//     console.log(`_handleDownloadFile:Copied ${pullRepoFile} -> ${vaultFile}`)
    
//     new Notice(`Pulled ${targetFileName} from ${pulledUserName}-${channelName}!`, 10000)
//     console.log("_handleDownloadFile:handle.push.context: ", context)

//     // echo
//     //TODO/ TAI: no implicit connections between subvaults...
//     // This is important for multi scoped notes
//     // I need to say to other scopes the note have being changed
//     const scopes = await getNoteObaSyncScope(vaultFile, channelsConfig)
//     console.log(`_handleDownloadFile:echo.scopes: ${scopes}`)
//     for (const channelName1 of scopes) {
//         console.log(`_handleDownloadFile:echo.channelName: ${channelName1}`)
//         // TODO/ handle returned status
//         const manIder = {channelName: channelName1, manType} 
//         await publishModifiedFileSignal({
//             vaultFile,
//             manIder,
//             committerName: vaultUserName,
//             channelsConfig,
//             signalTemplate: pulledSignal,
//             checkPulledMTime: true,
//             controlArgs,
//         })
//     }

//     return "handler.ok"
// }