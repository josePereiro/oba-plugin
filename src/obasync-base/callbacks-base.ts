import { OBA } from "src/oba-base/globals";
import { getObaConfig } from "src/oba-base/obaconfig";
import { registerObaCallback, runObaCallbacks } from "src/services-base/callbacks";
import { checkEnable } from "src/tools-base/oba-tools";
import { dropRepeatedCall } from "src/tools-base/schedule-tools";
import { DelayManager, randstring } from "src/tools-base/utils-tools";
import { commitObaSyncSignal, ObaSyncCallbackContext, ObaSyncIssuedSignal, processObaSyncSignals } from "./signals-base";
import { getCurrNotePath, getVaultDir } from "src/tools-base/obsidian-tools";
import { _addDummyAndCommit, _fetchCheckoutPull, _justPush } from "./channels-base";
import { getNoteObaSyncScope } from "./scope-base";
import { Notice } from "obsidian";

const ANYMOVE_DELAY: DelayManager = 
    new DelayManager(1000, 1001, -1, -1) // no delay

const ACT_MONITOR_DELAY: DelayManager = 
    new DelayManager(10000, 1001, -1, -1) // no delay

// DONE/TAI: create per note delay manager
function _createPushDelayManager() {
    return new DelayManager(3000, 1000, 5000, -1)
}

let PUSH_DELAYS: {[keys: string]: DelayManager} = {}
const PUSHING_SET = new Set()

export function _serviceCallbacks() {
    
    if (!checkEnable("obasync", {err: false, notice: false})) { return; }

    // MARK: anymove
    {
        const callbackID = '__obasync.obsidian.anymove';
        OBA.registerEvent(
            OBA.app.workspace.on('editor-change', (...args) => {
                runObaCallbacks(callbackID)
            })
        );
        OBA.registerEvent(
            OBA.app.workspace.on('file-open', () => {
                runObaCallbacks(callbackID)
            })
        );
        // OBA.registerDomEvent(window.document, "wheel", () => {
        //     runObaCallbacks(callbackID)
        // });
        // OBA.registerDomEvent(window.document, "mousemove", () => {
        //     runObaCallbacks(callbackID)
        // });
        OBA.registerDomEvent(window.document, "click", () => {
            runObaCallbacks(callbackID)
        });
        // OBA.registerDomEvent(window.document, "keyup", async () => {
        //     runObaCallbacks(callbackID)
        // });

        registerObaCallback(
            callbackID, 
            async () => {
                const now: Date = new Date()
                const flag = await ANYMOVE_DELAY.manageTime()
                if (flag != "go") { return; }
                await runObaCallbacks('obasync.obsidian.anymove')
            }
        )
    }

    // MARK: resolve signals
    {
        const callbackID = `obasync.obsidian.anymove`
        registerObaCallback(
            callbackID, 
            async () => {
                return await dropRepeatedCall(
                    `${callbackID}.pullAndProcessSignals`,
                    async () => {
                        await _pullAndProcessSignals(true)
                        // DEV
                        // await _pullAndProcessSignals(false)
                    }
                );
            }
        )
    }

    // MARK: activity mon
    {
        const callbackID = `obasync.obsidian.anymove`
        registerObaCallback(
            callbackID, 
            async () => {
                const flag = await ACT_MONITOR_DELAY.manageTime()
                if (flag != "go") { return; }
                return await dropRepeatedCall(
                    `obasync.obsidian.anymove:sendActivityMonitorSignal`,
                    async () => {
                        // console.clear()
                        await _sendActivityMonitorSignal()
                    }
                );
            }
        )
    }

    {
        const callbackID = `obasync.signal.missing.in.record0.or.newer:activity.monitor`
        registerObaCallback(
            callbackID, 
            async (context: ObaSyncCallbackContext) => {
                // TODO: interface 
                const signal = context?.["signal1Content"] || {}
                const token = signal?.["args"]?.["token"] || "Missing Token"
                const sender = signal?.["args"]?.["sender"] || "JonhDoe"
                new Notice(`Activity from ${sender}, token: ${token}`, 0)
                context["handlingStatus"] = "ok"
            }
        )
    }
}

// MARK: 
export async function _sendActivityMonitorSignal() {

    const userName0 = getObaConfig("obasync.me", null)
    const vaultDepot0 = getVaultDir()
    
    const channelsConfig = getObaConfig("obasync.channels", {})
    for (const channelName in channelsConfig) {
        console.log("channelName: ", channelName)
        const channelConfig = channelsConfig?.[channelName] || {}
        const pushDepot0 = channelConfig?.["push.depot"] || null
        console.log("pushDepot0: ", pushDepot0)
        
        await commitObaSyncSignal({
            vaultDepot0,
            pushDepot0,
            userName0,
            channelName,
            manType: 'main',
            signal0: { 
                "type": 'activity.monitor', 
                "args": {
                    "token": randstring(),
                    "sender": userName0,
                }
            }
        })
    }
}


async function _pullAndProcessSignals(
    pull = true,
) {

    const channelsConfig = getObaConfig("obasync.channels", {})
    const userName0 = getObaConfig("obasync.me", null)
    const vaultDepot0 = getVaultDir()
    for (const channelName in channelsConfig) {
        
        const channelConfig = channelsConfig?.[channelName] || {}
        const pushDepot0 = channelConfig?.["push.depot"] || null
        const pullDepots = channelConfig?.["pull.depots"] || {}
        for (const userName1 in pullDepots) {
            const pullDepot0 = pullDepots[userName1]
            // try pull pullDepot
            if (pull) {
                await _fetchCheckoutPull(pullDepot0, 10)
            }

            // process
            await processObaSyncSignals({
                vaultDepot0, pushDepot0, pullDepot0,
                manType: 'main',
                channelName,
                userName0
            })
        }
    }
}