import { copyFileSync, existsSync, statSync } from "fs";
import { Notice } from "obsidian";
import path from "path";
import { TagLogger } from "src/tools-base/dev-tools";
import { addDefaults, UnionParam } from "src/tools-base/utils-tools";
import { PulledMTimeReg } from "./modifiedFileSignal-base";
import { getObaSyncAllChannelsConfig } from "./obasync-base";
import { getNoteObaSyncScope } from "./scope-base";
import { HandlingStatus, ObaSyncSignal } from "./signals-base";
import { publishSignal } from "./signals-publish-base";


// MARK: publishModifiedFileSignal
export async function publishModifiedFileSignal(
    publishModifiedFileSignalArgs 
: {
    vaultFile: string,
    checkPulledMTime?: boolean,
    signalTemplate?: ObaSyncSignal
    publishSignalArgs: Omit<
        UnionParam<typeof publishSignal>, 
        "callback" | "hashDig" | "signalTemplate"
    >
}): Promise<HandlingStatus> {

    const taglogger = new TagLogger(["ObaSync", "publishModifiedFileSignal"])
    taglogger.loginit()

    addDefaults(publishModifiedFileSignalArgs, {
        checkPulledMTime: true
    })

    const { vaultFile, publishSignalArgs, checkPulledMTime } = publishModifiedFileSignalArgs
    taglogger.log({vaultFile})
    taglogger.log({publishSignalArgs})
    taglogger.log({checkPulledMTime})

    // context data
    if (!vaultFile) { 
        taglogger.error("Null vaultFile!");
        return "error"; 
    }
    if (!existsSync(vaultFile)) { 
        taglogger.error("Missing vaultFile!");
        return "error"; 
    }

    // check last pulled
    const { manIder } = publishSignalArgs
    const { channelName } = manIder
    if (checkPulledMTime){
        const flag = _checkLastPulled({vaultFile, channelName})
        if (flag != 'go') { return "ignored"} 
    }
    

    const channelsConfig = getObaSyncAllChannelsConfig({})
    const scopes = await getNoteObaSyncScope({
        path: vaultFile, 
        channelsConfig
    }) || []

    // check scope
    const inScope = scopes.contains(channelName)
    if (!inScope) { 
        taglogger.error("Note not in scope!");
        return "error"; 
    }
    
    const localFileName = path.basename(vaultFile)
    const channelConfig = channelsConfig[channelName] 
    const pushRepoOps = channelConfig["push.depot"]
    const pushDepot = pushRepoOps["repodir"]

    const signalTemplate = 
        publishModifiedFileSignalArgs?.["signalTemplate"]
        ?? { 
            "type": 'modified.file', 
            "args": {
                "targetFileName": localFileName,
            }
        }

    const signal = await publishSignal({
        ...publishSignalArgs,
        signalTemplate,
        callback() {
            // copy file
            const pushRepoPath = path.join(pushDepot, localFileName)
            copyFileSync(vaultFile, pushRepoPath)
            taglogger.log(`Copied ${vaultFile} -> ${pushRepoPath}`)
        },
        hashDig: [localFileName]
    })

    if (!signal) { 
        taglogger.error("!signal == true");
        return "error"; 
    }
    
    return "handler.ok"
}

// MARK: _checkLastPulled
function _checkLastPulled(
    args
: {
    channelName: string, 
    vaultFile: string
}) {
    const taglogger = new TagLogger(["ObaSync", "_checkLastPulled"])

    const {channelName, vaultFile} = args
    const pulledKey = `${channelName}:${vaultFile}`
    const currMTime = statSync(vaultFile).mtimeMs
    const regMTime = PulledMTimeReg?.[pulledKey] || -1
    if (currMTime == regMTime) {
        new Notice(`Ignored: currMTime == regMTime, ${pulledKey}`)
        taglogger.log(`Ignored: currMTime == regMTime, ${pulledKey}`)
        return 'ignore';
    }
    if (currMTime < regMTime) {
        taglogger.warn(`Ignored: currMTime < regMTime, ${pulledKey}`)
        new Notice(`Ignored: currMTime < regMTime, ${pulledKey}`)
        return 'ignore';
    }
    if (currMTime > regMTime) {
        taglogger.warn(`Go: currMTime > regMTime, ${pulledKey}`)
        new Notice(`Go: currMTime > regMTime, ${pulledKey}`)
        return 'go';
    }
    return 'error';
}
