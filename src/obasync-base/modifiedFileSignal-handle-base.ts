// MARK: _handleDownloadFile

import { copyFileSync, existsSync, statSync } from "fs"
import { Notice } from "obsidian"
import path from "path"
import { gitSyncUp } from "src/gittools-base/gitSyncUp"
import { getObaConfig } from "src/oba-base/obaconfig"
import { TagLogger } from "src/tools-base/dev-tools"
import { getVaultDir } from "src/tools-base/obsidian-tools"
import { addDefaults, UnionParam } from "src/tools-base/utils-tools"
import { PulledMTimeReg } from "./modifiedFileSignal-base"
import { publishModifiedFileSignal } from "./modifiedFileSignal-publish-base"
import { ObaSyncAllChannelsConfig } from "./obasync-base"
import { getNoteObaSyncScope } from "./scope-base"
import { HandlingStatus, ObaSyncEventCallbackContext } from "./signals-base"
import { utcTimeTag } from "./utils-base"

// TODO/ rename
export async function _handleDownloadFile(
    handleDownloadFileArgs
: {
    context: ObaSyncEventCallbackContext,
    channelsConfig: ObaSyncAllChannelsConfig,
    gitSyncUpArgs: Omit<
        UnionParam<typeof gitSyncUp>, 
        | "repoOps" | "commitMsg" | "callback"
    >
}): Promise<HandlingStatus> {

    const taglogger = new TagLogger(["ObaSync", "_handleDownloadFile"])
    taglogger.loginit()

    const {context, channelsConfig, gitSyncUpArgs} = handleDownloadFileArgs

    addDefaults(gitSyncUpArgs, {
        addEnable: true,
        cloneForce: false, 
        cloneEnable: false,
        commitEnable: true,
        dummyText: "123",
        touchEnable: false,
        mkRepoDirEnable: true,
        pushEnable: false, 
        rmRepoEnable: false, 
        timeoutMs: 10 * 1000,
        rollTimeOut: true
    })

    const {vaultDepot, pulledSignal, pullRepoOps} = context
    const {vaultUserName, pulledUserName} = context
    if (!pulledSignal) { return; }
    const pullDepot = pullRepoOps['repodir']
    taglogger.log({pulledSignal})
    taglogger.log({pullDepot})
    const targetFileName = pulledSignal?.["args"]['targetFileName']
    const channelName = context["manIder"]["channelName"]
    const vaultDir = getVaultDir()
    const relpath = getObaConfig("obanotes.notes.root.relpath", '')
    const destDir = path.join(vaultDir, relpath)
    const manType = context["manIder"]["manType"]

    // console.clear()
    taglogger.log({destDir})
    const pullRepoFile = path.join(pullDepot, targetFileName)
    if (!existsSync(pullRepoFile)) {
        new Notice(`pullRepoFile missing! ${pullRepoFile}!`)
        return "error"
    }
    const vaultFile = path.join(destDir, targetFileName)
    taglogger.log({pullRepoFile})
    taglogger.log({vaultFile})
    
    copyFileSync(pullRepoFile, vaultFile)
    const pulledKey = `${channelName}:${vaultFile}`
    PulledMTimeReg[pulledKey] = statSync(vaultFile).mtimeMs
    taglogger.log(`Copied ${pullRepoFile} -> ${vaultFile}`)
    
    new Notice(`Pulled ${targetFileName} from ${pulledUserName}-${channelName}!`, 10000)
    taglogger.log({context})

    // echo
    //TODO/ TAI: no implicit connections between subvaults...
    // This is important for multi scoped notes
    // I need to say to other scopes the note have being changed
    const scopes = await getNoteObaSyncScope({
        path: vaultFile, 
        channelsConfig
    })
    taglogger.log({scopes})
    for (const channelName1 of scopes) {
        taglogger.log({channelName1})
        // TODO/ handle returned status
        const pushRepoOps = channelsConfig[channelName1]["push.depot"]
        await publishModifiedFileSignal({
            vaultFile,
            checkPulledMTime: true,
            signalTemplate: pulledSignal,
            publishSignalArgs: {
                committerName: vaultUserName,
                manIder: {channelName: channelName1, manType},
                vaultDepot,
                notifyEnable: true,
                gitSyncUpArgs: {
                    ...gitSyncUpArgs,
                    repoOps: pushRepoOps,
                    commitMsg: `re-publish from ${channelName} - ${utcTimeTag()}`,
                }
            }
        })

    }

    return "handler.ok"
}
