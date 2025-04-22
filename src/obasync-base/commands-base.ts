import { OBA } from "src/oba-base/globals"
import { getObaConfig } from "src/oba-base/obaconfig"
import { getCurrNotePath } from "src/tools-base/obsidian-tools"
import { dropRepeatedCall, TaskState } from "src/tools-base/schedule-tools"
import { DelayManager } from "src/tools-base/utils-tools"
import { _sendActivityMonitorSignal, runSignalEventsAll } from "./callbacks-base"
import { _spawnModifiedFileSignal } from "./modifiedFileSignal-base"
import { ObaSyncScheduler } from "./obasync"


const COMMAND_SPAWN_MOD_FILE_TIME = new DelayManager(1000, 100, 1000, -1)

export function _serviceCommands() {
    
    OBA.addCommand({
        id: "oba-obasync-_spawnModifiedFileSignal",
        name: "ObaSync _spawnModifiedFileSignal",
        callback: async () => {

            const flag = await COMMAND_SPAWN_MOD_FILE_TIME.manageTime()
            if (flag != 'go') { return; }

            console.clear()
            const localFile = getCurrNotePath()
            if (!localFile) { return; }
            await sleep(1000)
            await _spawnModifiedFileSignal(localFile, { checkPulledMTime: false })
        }
    });

    OBA.addCommand({
        id: "oba-obasync-_pullAndRunSignalEventsCallback",
        name: "ObaSync _pullAndRunSignalEventsCallback",
        callback: async () => {
            console.clear()
            await runSignalEventsAll(true)
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