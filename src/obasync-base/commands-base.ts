import { OBA } from "src/oba-base/globals"
import { getObaConfig } from "src/oba-base/obaconfig"
import { dropRepeatedCall, TaskState } from "src/tools-base/schedule-tools"
import { _pullAndRunSignalEvents, _sendActivityMonitorSignal, _spawnModifiedFileSignal } from "./callbacks-base"
import { ObaSyncScheduler } from "./obasync"

export function _serviceCommands() {
    
    OBA.addCommand({
        id: "oba-obasync-_spawnModifiedFileSignal",
        name: "ObaSync _spawnModifiedFileSignal",
        callback: async () => {
            console.clear()
            await _spawnModifiedFileSignal()
        }
    });
    OBA.addCommand({
        id: "oba-obasync-_pullAndRunSignalEvents",
        name: "ObaSync _pullAndRunSignalEvents",
        callback: async () => {
            console.clear()
            await _pullAndRunSignalEvents()
        }
    });

    OBA.addCommand({
        id: "oba-obasync-send-activity-signal",
        name: "ObaSync send activity signal",
        callback: async () => {
            ObaSyncScheduler.spawn({
                id: "oba-obasync-send-activity-signal",
                taskFun: async (task: TaskState) => {
                    // console.clear()
                    console.log("_sendActivityMonitorSignal")
                    await _sendActivityMonitorSignal()
                    // clamp gas to 1
                    if (task["gas"] > 1) {
                        task["gas"] = 1
                    }
                }
            })
        }
    });

    OBA.addCommand({
        id: "oba-obasync-push-depots",
        name: "ObaSync push depots",
        callback: async () => {
            ObaSyncScheduler.spawn({
                id: "oba-obasync-push-depots",
                taskFun: async (task: TaskState) => {
                    // console.clear()
                    await _pushDepots()
                    if (task["gas"] > 1) {
                        task["gas"] = 1
                    }
                }
            })
        }
    });
}

export async function _pushDepots() {
    return await dropRepeatedCall(
        `oba-obasync-push-depots`,
        async () => {
            // console.clear()
            const channelsConfig = getObaConfig("obasync.channels", {})
            for (const channelName in channelsConfig) {
                console.log("channelName: ", channelName)
                const channelConfig = channelsConfig?.[channelName] || {}
                const pushDepot = channelConfig?.["push.depot"] || null
                // _spawnAddDummyAndCommitAndPush(pushDepot, "manual.pushing", "123", { tout: 10 })
            }
        }
    );
}