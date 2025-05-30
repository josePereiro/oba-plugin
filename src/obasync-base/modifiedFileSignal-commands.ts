import { addObaCommand } from "src/oba-base/commands"
import { getObaSyncAllChannelsConfig } from "./obasync-base"
import { publishModifiedFileSignal } from "./modifiedFileSignal-publish-base"
import { getCurrNotePath, getVaultDir } from "src/tools-base/obsidian-tools"
import { getNoteObaSyncScope } from "./scope-base"
import { getObaConfig } from "src/oba-base/obaconfig"
import { utcTimeTag } from "./utils-base"
import path from "path"
import { getVaultGitConfig } from "src/services-base/vault.git"

export function _modifiedFileSignal_commands() {

    // MARK: publish
    addObaCommand({
        commandName: "publish current file",
        serviceName: ["ObaSync", "ModifiedFileSignal"],
        async commandCallback({ commandID, commandFullName }) {
            console.clear()
            
            const vaultFile = getCurrNotePath()
            console.log({vaultFile})
            if (!vaultFile) { return; }
            const vaultFileName = path.basename(vaultFile)
            
            const channelsConfig = getObaSyncAllChannelsConfig({})
            console.log({channelsConfig})

            const scope = await getNoteObaSyncScope({path: vaultFile, channelsConfig}) || []
            const userName = getObaConfig("obasync.me", 'jonhDoe')
            const vaultDepot = getVaultDir()
            const vaultRepoOps = getVaultGitConfig()
            let vaultRepoSyncUpArgs;
            if (vaultRepoOps) {
                vaultRepoSyncUpArgs = { 
                    repoOps: vaultRepoOps,
                    commitMsg: `before.publishModifiedFileSignal - ${vaultFileName} - ${utcTimeTag()}` 
                }
            } else {
                vaultRepoSyncUpArgs = null
            }
            for (const channelName of scope) {
                // TODO/ Think how to include man type in configuration
                // or think how to discover them from disk...
                const manIder = {channelName, manType: 'main'} 
                const pushRepoOps = channelsConfig[channelName]["push.depot"]

                await publishModifiedFileSignal({
                    vaultFile, 
                    checkPulledMTime: true,
                    publishSignalArgs: {
                        vaultDepot,
                        committerName: userName,
                        manIder,
                        vaultRepoSyncUpArgs,
                        gitSyncUpArgs: {
                            repoOps: pushRepoOps,
                            addEnable: true,
                            commitEnable: true, 
                            cloneEnable: true,
                            cloneForce: false, 
                            commitMsg: `publish current file - ${vaultFileName} - ${utcTimeTag()}`,
                            pushEnable: true, 
                            dummyText: '',
                            touchEnable: false, 
                            mkRepoDirEnable: true, 
                            rmRepoEnable: true,
                            timeoutMs: 10 * 1000,
                            rollTimeOut: true, 
                        }
                    }
                })
            }
            
        }
    })

}