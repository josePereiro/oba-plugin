import { OBA } from "src/oba-base/globals"
import { getObaConfig } from "src/oba-base/obaconfig"
import { getCurrNotePath } from "src/tools-base/obsidian-tools"
import { TaskState } from "src/tools-base/schedule-tools"
import { TriggerManager } from "src/tools-base/schedule-tools"
import { publishModifiedFileSignal } from "./modifiedFileSignal-base"
import { ObaSyncScheduler } from "./obasync"
import { getNoteObaSyncScope } from "./scope-base"
import { resolveSignalEventsAllChannles } from "./signals-base"
import { _justPush } from "./git-base"
import { Notice } from "obsidian"
import { getObaSyncFlag, setObaSyncFlag } from "./obasync-base"


const COMMAND_SPAWN_MOD_FILE_TIME = new TriggerManager()

export function _serviceCommands() {
    
    OBA.addCommand({
        id: "oba-obasync-spawnModifiedFileSignal",
        name: "ObaSync spawnModifiedFileSignal",
        callback: async () => {

            // delay for saving
            const flag = 
                // 300, 100, -1, -1
                await COMMAND_SPAWN_MOD_FILE_TIME.manage({
                    ignoreTime: 300,
                    sleepTime: 100,
                    delayTime: -1,
                })
            if (flag != 'go') { return; }

            console.clear()
            const vaultFile = getCurrNotePath()
            if (!vaultFile) { return; }

            ObaSyncScheduler.spawn({
                id: `oba-obasync-spawnModifiedFileSignal:${vaultFile}`,
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
                                pushPushRepo: getObaSyncFlag(`online.mode`, false),
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
                id: `oba-obasync-spawnResolveVaultSignalEvents`,
                deltaGas: 1,
                taskFun: async (task: TaskState) => {
                    await resolveSignalEventsAllChannles({
                        commitVaultDepo: true,
                        pullVaultRepo: getObaSyncFlag(`online.mode`, false),
                        notify: true,
                    })
                    task["gas"] = 0
                }
            })
        }
    });

    OBA.addCommand({
        id: "oba-obasync-flip-online-mode",
        name: "ObaSync flip online mode",
        callback: async () => {

            // set flags
            setObaSyncFlag(`online.mode`, 
                !getObaSyncFlag(`online.mode`, false)
            )
            new Notice(`ObaSync online mode: ${getObaSyncFlag(`online.mode`, false)}`, 1000)

        }
    });

    OBA.addCommand({
        id: "oba-obasync-push-all",
        name: "ObaSync push-all",
        callback: async () => {

            // spawn push
            ObaSyncScheduler.spawn({
                id: `oba-obasync-push-all`,
                deltaGas: 100,
                taskFun: async (task: TaskState) => {
                    if (task["gas"] > 100) {
                        task["gas"] = 100
                    }
                    // run at the end
                    if (task["gas"] > 0) {
                        return
                    }
                        
                    const channelsConfig = getObaConfig("obasync.channels", {})
                    for (const channelName in channelsConfig) {
                        const pushDepot = channelsConfig[channelName]["push.depot"]
                        await _justPush(pushDepot, {tout: 30})
                        console.log(`Pushed ${channelName}`)
                        new Notice(`Pushed ${channelName}`, 1000)
                    }

                    task["gas"] = 0
                    
                }
            })
        }
    });
}