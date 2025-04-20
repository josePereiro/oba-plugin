import { copyFileSync, existsSync } from "fs";
import { getNoteObaSyncScope } from "./scope-base";
import path from "path";
import { commitObaSyncSignal, ObaSyncCallbackContext, ObaSyncIssuedSignal } from "./signals-base";
import { getVaultDir } from "src/tools-base/obsidian-tools";
import { Notice } from "obsidian";
import { _justPush } from "./channels-base";

/*
    Handle the push of a file
*/ 
export async function _publishFileVersion(
    localFile: string,
    channelName: string,
    userName0: string,
    channelsConfig: any,
) {
    // context data
    if (!localFile) { return; }
    if (!existsSync(localFile)) { return; }
    
    const scopes = await getNoteObaSyncScope(localFile, channelsConfig) || []

    // check scope
    const inScope = scopes.contains(channelName)
    if (!inScope) { 
        console.log("Note not in scope!");
        return; 
    }
    
    const localFileName = path.basename(localFile)
    const channelConfig = channelsConfig?.[channelName] || {}
    const pushDepot0 = channelConfig?.["push.depot"] || null
    const vaultDepot0 = getVaultDir()

    await commitObaSyncSignal({
        vaultDepot0,
        pushDepot0,
        userName0,
        channelName,
        manType: 'main',
        signal0: { 
            "type": 'modified.file', 
            "args": {
                "sender": userName0,
                "fileName": localFileName,
                "channelName": channelName
            }
        },
        "hashDig": [localFileName]
    })

    // push
    await _justPush(pushDepot0, { tout: 10 })
}

export async function _downloadFileVersionFromContext(
    context: ObaSyncCallbackContext,
    channelsConfig: any,
) {

    const signal = context?.['signal1Content']
    if (!signal) { return; }
    const pullDepot = context?.['pullDepot0']
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
    console.clear()
    console.log("destDir: ", destDir)
    const srcPath = path.join(pullDepot, remoteFile)
    if (!existsSync(srcPath)) {
        context["handlingStatus"] = 'ok'
        new Notice(`srcPath missing! ${srcPath}!`)
        return
    }
    const destPath = path.join(destDir, remoteFile)
    console.log("destDir: ", destDir)
    console.log("srcPath: ", srcPath)
    console.log("destPath: ", destPath)
    copyFileSync(srcPath, destPath)

    new Notice(`Pulled ${remoteFile} from ${userName1}-${channelName}!`, 10000)
    context["handlingStatus"] = 'ok'
    console.log("handle.push.context: ", context)

    // republish
    // This is important for multi scoped notes
    // I need to say to other scopes the note have being changed
    const scopes = await getNoteObaSyncScope(destPath, channelsConfig)
    for (const channelName1 of scopes) {
        if (channelName == channelName1) { continue; }
        await _publishFileVersion(destPath, channelName1, userName0, channelsConfig)
    }
}