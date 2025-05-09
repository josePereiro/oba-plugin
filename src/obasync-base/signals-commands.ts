import { addObaCommand } from "src/oba-base/commands"
import { getObaSyncAllChannelsConfig } from "./obasync-base"
import { resolveSignalEvents } from "./signals-resolve-base"
import { getVaultGitConfig } from "src/services-base/vault.git"
import { getObaConfig } from "src/oba-base/obaconfig"
import { getVaultDir } from "src/tools-base/obsidian-tools"

export function _obasync_signals_commands() {

    addObaCommand({
        commandName: "resolve signals",
        serviceName: ["ObaSync"],
        async commandCallback({ commandID, commandFullName }) {
            console.clear()
            const channelsConfig = getObaSyncAllChannelsConfig({})
            const vaultRepoOps = getVaultGitConfig()
            let vaultRepoSyncUpArgs;
            if (vaultRepoOps) {
                vaultRepoSyncUpArgs = { repoOps: vaultRepoOps }
            } else {
                vaultRepoSyncUpArgs = null
            }
            const vaultDepot = getVaultDir()
            const userName = getObaConfig("obasync.me", 'jonhDoe')
            for (const channelName in channelsConfig) {
                const channelConfig = channelsConfig[channelName]
                const pushRepoOps = channelConfig["push.depot"]
                const pullReposConfig = channelConfig["pull.depots"]
                for (const pullRepoOps of pullReposConfig) {
                    await resolveSignalEvents({
                        vaultDepot,
                        channelName,
                        manType: 'main',
                        vaultUserName: userName,
                        pullRepoSyncDownArgs: {
                            repoOps: pullRepoOps, 
                            cloneEnable: true,
                            fetchEnable: true
                        },
                        pushRepoOps,
                        vaultRepoSyncUpArgs
                    })
                }
            }
        }
    }) 

}