import { copyFileSync, existsSync, statSync } from "fs";
import { Notice } from "obsidian";
import path from "path";
import { getObaConfig } from "src/oba-base/obaconfig";
import { getVaultDir } from "src/tools-base/obsidian-tools";
import { TaskState } from "src/tools-base/schedule-tools";
import { ObaSyncManifestIder } from "./manifests-base";
import { ObaSyncScheduler } from "./obasync";
import { getNoteObaSyncScope } from "./scope-base";
import { _publishedSignalNotification, _publishSignalArgs, _publishSignalControlArgs, HandlingStatus, ObaSyncCallbackContext, ObaSyncSignal, publishSignal } from "./signals-base";

const PulledMTimeReg = {} as {[keys: string]: number}

// MARK: commit
export async function _commitModifiedFileSignal({
    vaultFile,
    manIder,
    committerName,
    channelsConfig,
    controlArgs,
    checkPulledMTime,
} : {
    vaultFile: string,
    manIder: ObaSyncManifestIder,
    committerName: string,
    channelsConfig: any,
    controlArgs: _publishSignalControlArgs,
    checkPulledMTime: boolean
}): Promise<HandlingStatus> {

    console.log("--------------------------")
    console.log("_commitModifiedFileSignal")

    // context data
    if (!vaultFile) { 
        console.error("Null vaultFile!");
        return "error"; 
    }
    if (!existsSync(vaultFile)) { 
        console.error("Missing vaultFile!");
        return "error"; 
    }

    // check last pulled
    const { channelName } = manIder
    if (checkPulledMTime) {
        const pulledKey = `${channelName}:${vaultFile}`
        const currMTime = statSync(vaultFile).mtimeMs
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
    
    const scopes = await getNoteObaSyncScope(vaultFile, channelsConfig) || []

    // check scope
    const inScope = scopes.contains(channelName)
    if (!inScope) { 
        console.error("Note not in scope!");
        return "error"; 
    }
    
    const localFileName = path.basename(vaultFile)
    const channelConfig = channelsConfig?.[channelName] || {}
    const pushDepot = channelConfig?.["push.depot"] || null
    const vaultDepot = getVaultDir()

    const signal = await publishSignal({
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
            copyFileSync(vaultFile, pushRepoPath)
            console.log(`Copied ${vaultFile} -> ${pushRepoPath}`)
        },
        ...controlArgs
    })
    if (!signal) { 
        console.error("!signal == true");
        return "error"; 
    }
    
    return "handler.ok"
}

// MARK: spawn
export async function _spawnModifiedFileSignal({
    vaultFile, 
    checkPulledMTime,
    controlArgs,
}: {
    vaultFile: string, 
    checkPulledMTime: boolean,
    controlArgs: _publishSignalControlArgs,
}) {
    console.log("--------------------------")
    console.log("_spawnModifiedFileSignal")

    ObaSyncScheduler.spawn({
        id: `publishFileVersion:${vaultFile}`,
        deltaGas: 1,
        taskFun: async (task: TaskState) => {
            const committerName = getObaConfig("obasync.me", null)
            if (!committerName) { return; }
            const channelsConfig = getObaConfig("obasync.channels", {})
            console.log("channelsConfig: ", channelsConfig)
            const scope = await getNoteObaSyncScope(vaultFile, channelsConfig) || []
            console.log("scope: ", scope)
            for (const channelName of scope) {
                // TODO/ Think how to include man type in configuration
                // or think how to discover them from disk...
                const manIder = {channelName, manType: 'main'} 
                await _commitModifiedFileSignal({
                    vaultFile,
                    manIder,
                    committerName,
                    channelsConfig,
                    checkPulledMTime,
                    controlArgs,
                })
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

export async function _handleDownloadFile({
    context,
    channelsConfig,
    controlArgs
}: {
    context: ObaSyncCallbackContext,
    channelsConfig: any,
    controlArgs: _publishSignalControlArgs
}): Promise<HandlingStatus> {

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
        // await _commitModifiedFileSignal(vaultFile, manIder, vaultUserName, channelsConfig, { checkPulledMTime: true })
        await _commitModifiedFileSignal({
            vaultFile,
            manIder,
            committerName: vaultUserName,
            channelsConfig,
            checkPulledMTime: true,
            controlArgs,
        })
    }

    return "handler.ok"
}