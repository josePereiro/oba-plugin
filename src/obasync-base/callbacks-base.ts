import { OBA } from "src/oba-base/globals";
import { getObaConfig } from "src/oba-base/obaconfig";
import { registerObaCallback, runObaCallbacks } from "src/services-base/callbacks";
import { checkEnable } from "src/tools-base/oba-tools";
import { dropRepeatedCall, TaskState } from "src/tools-base/schedule-tools";
import { DelayManager, randstring } from "src/tools-base/utils-tools";
import { commitObaSyncSignal, ObaSyncCallbackContext, ObaSyncIssuedSignal, processObaSyncSignals } from "./signals-base";
import { getCurrNotePath, getVaultDir } from "src/tools-base/obsidian-tools";
import { _addDummyAndCommit, _fetchCheckoutPull, _justPush } from "./channels-base";
import { getNoteObaSyncScope } from "./scope-base";
import { Notice } from "obsidian";
import { ObaSyncScheduler } from "./obasync";
import { _downloadFileVersionFromContext, _publishFileVersion } from "./syncFileSignal-base";
import { cloneDeep } from "lodash";

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
                ObaSyncScheduler.spawn({
                    id: `${callbackID}:pullAndProcessSignals`,
                    taskFun: async (task: TaskState) => {
                        console.clear()
                        await _pullAndProcessSignals(true)
                        // DEV
                        // await _pullAndProcessSignals(false)
                        if (task["gas"] > 1) {
                            task["gas"] = 1
                        }
                    }
                })
            }
        )
    }

    // MARK: activity mon
    // {
    //     const callbackID = `obasync.obsidian.anymove`
    //     registerObaCallback(
    //         callbackID, 
    //         async () => {
    //             const flag = await ACT_MONITOR_DELAY.manageTime()
    //             if (flag != "go") { return; }
    //             ObaSyncScheduler.spawn({
    //                 id: `obasync.obsidian.anymove:sendActivityMonitorSignal`,
    //                 taskFun: async (task: TaskState) => {
    //                     console.clear()
    //                     await _sendActivityMonitorSignal()
    //                     if (task["gas"] > 1) {
    //                         task["gas"] = 1
    //                     }
    //                 }
    //             })
    //         }
    //     )
    // }

    // publish.files
    {
        OBA.registerEvent(
            OBA.app.workspace.on('editor-change', (...args) => {
                const localFile = getCurrNotePath()
                if (!localFile) { return; }
                const userName0 = getObaConfig("obasync.me", null)
                if (!userName0) { return; }
                ObaSyncScheduler.spawn({
                    id: `publishFileVersion:${localFile}`,
                    taskFun: async (task: TaskState) => {
                        const channelsConfig = getObaConfig("obasync.channels", {})
                        const scope = await getNoteObaSyncScope(localFile, channelsConfig) || []
                        for (const channelName of scope) {
                            await _publishFileVersion(
                                localFile,
                                channelName,
                                userName0,
                                channelsConfig,
                            )                
                        }
                        if(task["gas"] > 1) {
                            task["gas"] = 1
                        }
                    }, 
                })
            })
        );

        
    }

    // download.files
    {
        const callbackID = `obasync.signal.missing.in.record0.or.newer:modified.file`
        registerObaCallback(
            callbackID, 
            async (context0: ObaSyncCallbackContext) => {
                const context = cloneDeep(context0) // independent copy
                const channelname = context["channelName"]
                const signal1HashKey = context["signal1HashKey"]
                const channelsConfig = getObaConfig("obasync.channels", {})
                // spawn
                ObaSyncScheduler.spawn({
                    id: `${callbackID}:${channelname}:${signal1HashKey}`,
                    taskFun: async (task: TaskState) => {
                        await _downloadFileVersionFromContext(
                            context, channelsConfig,
                        )
                        task["gas"] = 0
                    }, 
                })
                context0["handlingStatus"] = 'ok'
            }
        )
    }

    // // activity.monitor
    // {
    //     const callbackID = `obasync.signal.missing.in.record0.or.newer:activity.monitor`
    //     registerObaCallback(
    //         callbackID, 
    //         async (context0: ObaSyncCallbackContext) => {
    //             const context = cloneDeep(context0) // independent copy
    //             const signal1HashKey = context["signal1HashKey"]
    //             const channelsConfig = getObaConfig("obasync.channels", {})
    //             // spawn
    //             ObaSyncScheduler.spawn({
    //                 id: `${callbackID}:${signal1HashKey}`,
    //                 taskFun: (task: TaskState) => {
    //                     _handleActivityMonitorSignal(context)
    //                     task["gas"] = 0
    //                 }, 
    //             })
    //             context0["handlingStatus"] = 'ok'
    //             // TODO: interface 
                
    //         }
    //     )
    // }
}

function _handleActivityMonitorSignal(context: ObaSyncCallbackContext) {
    const signal = context?.["signal1Content"] || {}
    const token = signal?.["args"]?.["token"] || "Missing Token"
    const sender = signal?.["args"]?.["sender"] || "JonhDoe"
    new Notice(`Activity from ${sender}, token: ${token}`, 0)
    context["handlingStatus"] = "ok"
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

        // push
        await _justPush(pushDepot0, 10)
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
                userName0,
                channelName
            })
        }
    }
}