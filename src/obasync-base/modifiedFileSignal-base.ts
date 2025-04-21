import { copyFileSync, existsSync } from "fs";
import { Notice } from "obsidian";
import path from "path";
import { getVaultDir } from "src/tools-base/obsidian-tools";
import { getNoteObaSyncScope } from "./scope-base";
import { commitObaSyncSignal, HandlingStatus, ObaSyncCallbackContext } from "./signals-base";

type FileEditType = 
    "pulled" | 
    "rellaying" | 
    "released"

export const PulledFileReg = {} as {[keys: string]: FileEditType}

// MARK: commit
export async function _commitModifiedFileSignal(
    localFile: string,
    channelName: string,
    userName0: string,
    channelsConfig: any,
): Promise<HandlingStatus> {

    // context data
    if (!localFile) { 
        console.error("Null localFile!");
        return "error"; 
    }
    if (!existsSync(localFile)) { 
        console.error("Missing localFile!");
        return "error"; 
    }

    // check pulled
    // Avoid recommiting if the file was pulled
    PulledFileReg[localFile] = PulledFileReg?.[localFile] || "released"
    if (PulledFileReg[localFile] == "pulled") {
        PulledFileReg[localFile] = "released"
        return;
    }
    
    const scopes = await getNoteObaSyncScope(localFile, channelsConfig) || []

    // check scope
    const inScope = scopes.contains(channelName)
    if (!inScope) { 
        console.error("Note not in scope!");
        return "error"; 
    }
    
    const localFileName = path.basename(localFile)
    const channelConfig = channelsConfig?.[channelName] || {}
    const pushDepot = channelConfig?.["push.depot"] || null
    const vaultDepot = getVaultDir()

    await commitObaSyncSignal({
        vaultDepot,
        pushDepot,
        issuerName: userName0,
        channelName,
        manType: 'main',
        signalTemplate: { 
            "type": 'modified.file', 
            "args": {
                "sender": userName0,
                "fileName": localFileName,
                "channelName": channelName
            }
        },
        hashKey: null, 
        hashDig: [localFileName], 
        callback: () => {
            // copy file
            const destPath = path.join(pushDepot, localFileName)
            copyFileSync(localFile, destPath)
            console.log(`Copied ${localFile} -> ${destPath}`)
        },
    })
    
    return "processed.ok"
}

// MARK: handle
// TODO/ rename

export async function _handleDownloadFile(
    context: ObaSyncCallbackContext,
    channelsConfig: any,
): Promise<HandlingStatus> {

    const signal = context?.['signal1']
    if (!signal) { return; }
    const pullDepot = context?.['pullDepot']
    const userName0 = context?.['userName0']
    const userName1 = context?.['userName1']
    console.log("push.signal: ", signal)
    console.log("pullDepot: ", pullDepot)
    const remoteFile = signal?.["args"]?.['fileName']
    const channelName = signal?.["args"]?.['channelName']
    const vaultDir = getVaultDir()
    const channelConfig = channelsConfig?.[channelName] || {}
    const relpath = channelConfig?.["pull.dest.folder.relpath"] || ''
    const destDir = path.join(vaultDir, relpath)
    // console.clear()
    console.log("destDir: ", destDir)
    const srcPath = path.join(pullDepot, remoteFile)
    if (!existsSync(srcPath)) {
        new Notice(`srcPath missing! ${srcPath}!`)
        return "error"
    }
    const destPath = path.join(destDir, remoteFile)
    console.log("destDir: ", destDir)
    console.log("srcPath: ", srcPath)
    console.log("destPath: ", destPath)
    copyFileSync(srcPath, destPath)
    console.log(`Copied ${srcPath} -> ${destPath}`)

    new Notice(`Pulled ${remoteFile} from ${userName1}-${channelName}!`, 10000)
    console.log("handle.push.context: ", context)

    // // republish
    // //TODO/ TAI: no implicit connections between subvaults...
    // // This is important for multi scoped notes
    // // I need to say to other scopes the note have being changed
    // const scopes = await getNoteObaSyncScope(destPath, channelsConfig)
    // for (const channelName1 of scopes) {
    //     if (channelName == channelName1) { continue; }
    //     // here destPath is the local File
    //     // TODO/ handle returned status
    //     PulledFileReg[destPath] = "rellaying"
    //     await _commitModifiedFileSignal(destPath, channelName1, userName0, channelsConfig)
    // }

    // set counter
    PulledFileReg[destPath] = "pulled"

    return "processed.ok"
}