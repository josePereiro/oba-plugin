import { OBA } from "src/oba-base/globals"
import { getObaConfig } from "src/oba-base/obaconfig"
import { checkEnable } from "src/tools-base/oba-tools"
import { dropRepeatedCall } from "src/tools-base/schedule-tools"
import { _addDummyAndCommit, _checkoutDot, _clearWD, _fetchCheckoutPull, _justPush } from "./channels-base"
import { randstring } from "src/tools-base/utils-tools"
import { _sendActivityMonitorSignal } from "./callbacks-base"

export function _serviceCommands() {
    OBA.addCommand({
        id: "oba-obasync-send-activity-signal",
        name: "ObaSync send activity signal",
        callback: async () => {
            return await dropRepeatedCall(
                `obasync.obsidian.anymove:sendActivityMonitorSignal`,
                async () => {
                    // console.clear()
                    console.log("_sendActivityMonitorSignal")
                    await _sendActivityMonitorSignal()
                }
            );
        }
    });
    
    OBA.addCommand({
        id: "oba-obasync-force-sync",
        name: "ObaSync force sync",
        callback: async () => {
            checkEnable("obasync", {err: true, notice: true})
            await dropRepeatedCall(
                "oba-obasync-dev",
                async () => {
                    console.clear()
                    const channelsConfig = getObaConfig("obasync.channels", {})
                    for (const channelName in channelsConfig) {
                        console.log()
                        console.log("------------")
                        console.log("channelName: ", channelName)
                        console.log()

                        const channelConfig = channelsConfig?.[channelName] || {}
                        const pushDepot = channelConfig?.["push.depot"] || null
                        console.log("pushDepot: ", pushDepot)
                        await _clearWD(pushDepot)
                        await _checkoutDot(pushDepot)
                        await _addDummyAndCommit(pushDepot, "test!", randstring())
                        await _justPush(pushDepot)
                        
                        const pullDepots = channelConfig?.["pull.depots"] || []
                        for (const pullDepot of pullDepots) {
                            console.log("pullDepot: ", pullDepot)
                            await _clearWD(pullDepot)
                            await _checkoutDot(pullDepot)
                            await _fetchCheckoutPull(pullDepot)
                        }
                    }
                }
            )
        }
    })
}