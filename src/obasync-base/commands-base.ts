import { OBA } from "src/oba-base/globals"
import { getObaConfig } from "src/oba-base/obaconfig"
import { checkEnable } from "src/tools-base/oba-tools"
import { dropRepeatedCall, TaskState } from "src/tools-base/schedule-tools"
import { _addDummyAndCommit, _resetHard, _clearWD, _fetchCheckoutPull, _justPush } from "./channels-base"
import { randstring } from "src/tools-base/utils-tools"
import { _sendActivityMonitorSignal } from "./callbacks-base"
import { ObaSyncScheduler } from "./obasync-base"

export function _serviceCommands() {
    OBA.addCommand({
        id: "oba-obasync-send-activity-signal",
        name: "ObaSync send activity signal",
        callback: async () => {
            ObaSyncScheduler.spawn({
                id: "oba-obasync-send-activity-signal",
                taskFun: async (task: TaskState) => {
                    console.clear()
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
                    console.clear()
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
            console.clear()
            const channelsConfig = getObaConfig("obasync.channels", {})
            for (const channelName in channelsConfig) {
                console.log("channelName: ", channelName)
                const channelConfig = channelsConfig?.[channelName] || {}
                const pushDepot0 = channelConfig?.["push.depot"] || null
                await _justPush(pushDepot0, 10)
            }
        }
    );
}