import { copyFileSync, existsSync, statSync } from "fs";
import { Notice } from "obsidian";
import path from "path";
import { getVaultDir } from "src/tools-base/obsidian-tools";
import { getNoteObaSyncScope } from "./scope-base";
import { commitObaSyncSignal, HandlingStatus, ObaSyncCallbackContext } from "./signals-base";
import { ObaSyncScheduler } from "./obasync";
import { TaskState } from "src/tools-base/schedule-tools";
import { getObaConfig } from "src/oba-base/obaconfig";

const PulledMTimeReg = {} as {[keys: string]: number}

// MARK: commit
export async function _commitModifiedFileSignal(
    localFile: string,
    channelName: string,
    userName0: string,
    channelsConfig: any,
    {
        checkPulledMTime = true
    }
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

    // check last pulled
    if (checkPulledMTime) {
        const pulledKey = `${channelName}:${localFile}`
        const currMTime = statSync(localFile).mtimeMs
        const regMTime = PulledMTimeReg?.[pulledKey] || -1
        if (currMTime == regMTime) {
            new Notice(`Ignored: currMTime == regMTime, ${pulledKey}`)
            console.log(`Ignored: currMTime == regMTime, ${pulledKey}`)
            return;
        }
        if (currMTime < regMTime) {
            console.error(`Ignored: currMTime < regMTime, ${pulledKey}`)
            new Notice(`Ignored: currMTime < regMTime, ${pulledKey}`)
            return;
        }
        if (currMTime > regMTime) {
            console.error(`Go: currMTime > regMTime, ${pulledKey}`)
            new Notice(`Go: currMTime > regMTime, ${pulledKey}`)
        }
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
            const pushRepoPath = path.join(pushDepot, localFileName)
            copyFileSync(localFile, pushRepoPath)
            console.log(`Copied ${localFile} -> ${pushRepoPath}`)
        },
    })
    
    return "processed.ok"
}

// MARK: spawn
export async function _spawnModifiedFileSignal(
    localFile: string, 
    {
        checkPulledMTime = true
    }
) {
    console.log("_spawnModifiedFileSignal")

    ObaSyncScheduler.spawn({
        id: `publishFileVersion:${localFile}`,
        deltaGas: 1,
        taskFun: async (task: TaskState) => {
            const userName0 = getObaConfig("obasync.me", null)
            if (!userName0) { return; }
            const channelsConfig = getObaConfig("obasync.channels", {})
            console.log("channelsConfig: ", channelsConfig)
            const scope = await getNoteObaSyncScope(localFile, channelsConfig) || []
            console.log("scope: ", scope)
            for (const channelName of scope) {
                await _commitModifiedFileSignal(
                    localFile,
                    channelName,
                    userName0,
                    channelsConfig,
                    { checkPulledMTime }
                )                
            }
            // clamp gas
            if (task["gas"] > 1) {
                task["gas"] = 1
            }
        }, 
    })
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
    const pullRepoFile = path.join(pullDepot, remoteFile)
    if (!existsSync(pullRepoFile)) {
        new Notice(`pullRepoFile missing! ${pullRepoFile}!`)
        return "error"
    }
    const vaultFile = path.join(destDir, remoteFile)
    console.log("destDir: ", destDir)
    console.log("pullRepoFile: ", pullRepoFile)
    console.log("vaultFile: ", vaultFile)
    // TODO/TAI/ I can make the Register channel dependent too
    
    copyFileSync(pullRepoFile, vaultFile)
    const pulledKey = `${channelName}:${vaultFile}`
    PulledMTimeReg[pulledKey] = statSync(vaultFile).mtimeMs
    console.log(`Copied ${pullRepoFile} -> ${vaultFile}`)
    
    new Notice(`Pulled ${remoteFile} from ${userName1}-${channelName}!`, 10000)
    console.log("handle.push.context: ", context)

    // echo
    //TODO/ TAI: no implicit connections between subvaults...
    // This is important for multi scoped notes
    // I need to say to other scopes the note have being changed
    const scopes = await getNoteObaSyncScope(vaultFile, channelsConfig)
    console.log(`echo.scopes: ${scopes}`)
    for (const channelName1 of scopes) {
        console.log(`echo.channelName: ${channelName1}`)
        // here vaultFile is the local File
        // TODO/ handle returned status
        await _commitModifiedFileSignal(vaultFile, channelName1, userName0, channelsConfig, { checkPulledMTime: true })
    }

    return "processed.ok"
}