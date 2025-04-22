import { OBA } from "src/oba-base/globals"
import { getObaConfig } from "src/oba-base/obaconfig"
import { getCurrNotePath } from "src/tools-base/obsidian-tools"
import { TaskState } from "src/tools-base/schedule-tools"
import { DelayManager } from "src/tools-base/utils-tools"
import { publishModifiedFileSignal } from "./modifiedFileSignal-base"
import { ObaSyncScheduler } from "./obasync"
import { getNoteObaSyncScope } from "./scope-base"
import { resolveVaultSignalEvents } from "./signals-base"


const COMMAND_SPAWN_MOD_FILE_TIME = new DelayManager(1000, 100, 1000, -1)

export function _serviceCommands() {
    
    OBA.addCommand({
        id: "oba-obasync-spawnModifiedFileSignal",
        name: "ObaSync spawnModifiedFileSignal",
        callback: async () => {

            // delay for saving
            const flag = await COMMAND_SPAWN_MOD_FILE_TIME.manageTime()
            if (flag != 'go') { return; }

            console.clear()
            const vaultFile = getCurrNotePath()
            if (!vaultFile) { return; }

            ObaSyncScheduler.spawn({
                id: `publishFileVersion:${vaultFile}:push`,
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
                        await publishModifiedFileSignal({
                            vaultFile,
                            manIder,
                            committerName,
                            channelsConfig,
                            checkPulledMTime: false,
                            controlArgs: {
                                commitVaultRepo: true,
                                commitPushRepo: true,
                                pushPushRepo: true,
                                notify: true
                            }
                        })
                    }
                    // clamp gas
                    if (task["gas"] > 1) {
                        task["gas"] = 1
                    }
                }, 
            })
            
        }
    });

    OBA.addCommand({
        id: "oba-obasync-spawnResolveVaultSignalEvents",
        name: "ObaSync spawnResolveVaultSignalEvents",
        callback: async () => {
            ObaSyncScheduler.spawn({
                id: `resolveVaultSignalEvents`,
                deltaGas: 1,
                taskFun: async (task: TaskState) => {
                    await resolveVaultSignalEvents({
                        commitVaultDepo: true,
                        pullVaultRepo: true,
                        notify: true,
                    })
                    task["gas"] = 0
                }
            })
        }
    });
}