import { copyFileSync, existsSync, statSync } from "fs";
import { Notice } from "obsidian";
import path from "path";
import { getObaConfig } from "src/oba-base/obaconfig";
import { getVaultDir } from "src/tools-base/obsidian-tools";
import { TaskState } from "src/tools-base/schedule-tools";
import { ObaSyncManifestIder } from "./manifests-base";
import { ObaSyncScheduler } from "./obasync";
import { getNoteObaSyncScope } from "./scope-base";
import { commitObaSyncSignal, HandlingStatus, ObaSyncCallbackContext } from "./signals-base";

const PulledMTimeReg = {} as {[keys: string]: number}

// MARK: commit
export async function _commitModifiedFileSignal(
    localFile: string,
    manIder: ObaSyncManifestIder,
    committerName: string,
    channelsConfig: any,
    {
        checkPulledMTime = true
    }
): Promise<HandlingStatus> {

    console.log("--------------------------")
    console.log("_commitModifiedFileSignal")

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
    const { channelName } = manIder
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
        committerName,
        manIder,
        signalTemplate: { 
            "type": 'modified.file', 
            "args": {
                "targetFileName": localFileName,
            }
        },
        hashDig: [localFileName], 
        callback: () => {
            // copy file
            const pushRepoPath = path.join(pushDepot, localFileName)
            copyFileSync(localFile, pushRepoPath)
            console.log(`Copied ${localFile} -> ${pushRepoPath}`)
        },
    })
    
    return "handler.ok"
}

// MARK: spawn
export async function _spawnModifiedFileSignal(
    localFile: string, 
    {
        checkPulledMTime = true
    }
) {
    console.log("--------------------------")
    console.log("_spawnModifiedFileSignal")

    ObaSyncScheduler.spawn({
        id: `publishFileVersion:${localFile}`,
        deltaGas: 1,
        taskFun: async (task: TaskState) => {
            const committerName = getObaConfig("obasync.me", null)
            if (!committerName) { return; }
            const channelsConfig = getObaConfig("obasync.channels", {})
            console.log("channelsConfig: ", channelsConfig)
            const scope = await getNoteObaSyncScope(localFile, channelsConfig) || []
            console.log("scope: ", scope)
            for (const channelName of scope) {
                // TODO/ Thinkhow to include man type in configuration
                // or think how to discover them from disk...
                const manIder = {channelName, manType: 'main'} 
                await _commitModifiedFileSignal(
                    localFile,
                    manIder,
                    committerName,
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

    console.log("--------------------------")
    console.log("_handleDownloadFile")

    const pulledSignal = context['pulledSignal']
    if (!pulledSignal) { return; }
    const pullDepot = context['pullDepot']
    const vaultUserName = context['vaultUserName']
    const pulledUserName = context['pulledUserName']
    console.log("pulledSignal: ", pulledSignal)
    console.log("pullDepot: ", pullDepot)
    const targetFileName = pulledSignal?.["args"]['targetFileName']
    const channelName = context["manIder"]["channelName"]
    const vaultDir = getVaultDir()
    const channelConfig = channelsConfig?.[channelName] || {}
    const relpath = channelConfig?.["pull.dest.folder.relpath"] || ''
    const destDir = path.join(vaultDir, relpath)
    const manType = context["manIder"]["manType"]

    // console.clear()
    console.log("destDir: ", destDir)
    const pullRepoFile = path.join(pullDepot, targetFileName)
    if (!existsSync(pullRepoFile)) {
        new Notice(`pullRepoFile missing! ${pullRepoFile}!`)
        return "error"
    }
    const vaultFile = path.join(destDir, targetFileName)
    console.log("pullRepoFile: ", pullRepoFile)
    console.log("vaultFile: ", vaultFile)
    
    copyFileSync(pullRepoFile, vaultFile)
    const pulledKey = `${channelName}:${vaultFile}`
    PulledMTimeReg[pulledKey] = statSync(vaultFile).mtimeMs
    console.log(`Copied ${pullRepoFile} -> ${vaultFile}`)
    
    new Notice(`Pulled ${targetFileName} from ${pulledUserName}-${channelName}!`, 10000)
    console.log("handle.push.context: ", context)

    // echo
    //TODO/ TAI: no implicit connections between subvaults...
    // This is important for multi scoped notes
    // I need to say to other scopes the note have being changed
    const scopes = await getNoteObaSyncScope(vaultFile, channelsConfig)
    console.log(`echo.scopes: ${scopes}`)
    for (const channelName1 of scopes) {
        console.log(`echo.channelName: ${channelName1}`)
        // TODO/ handle returned status
        const manIder = {channelName: channelName1, manType} 
        await _commitModifiedFileSignal(vaultFile, manIder, vaultUserName, channelsConfig, { checkPulledMTime: true })
    }

    return "handler.ok"
}