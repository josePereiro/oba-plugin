import { Notice } from "obsidian";
import { OBA } from "src/oba-base/globals";
import { getObaConfig } from "src/oba-base/obaconfig";
import { registerObaCallback, runObaCallbacks } from "src/services-base/callbacks";
import { checkEnable } from "src/tools-base/oba-tools";
import { getCurrNotePath, getVaultDir } from "src/tools-base/obsidian-tools";
import { TaskState } from "src/tools-base/schedule-tools";
import { DelayManager, randstring } from "src/tools-base/utils-tools";
import { _addDummyAndCommit, _fetchCheckoutPull, _justPush, _spawnFetchCheckoutPull } from "./channels-base";
import { _commitModifiedFileSignal, _handleDownloadFile } from "./modifiedFileSignal-base";
import { ObaSyncScheduler } from "./obasync";
import { getNoteObaSyncScope } from "./scope-base";
import { commitObaSyncSignal, HandlingStatus, ObaSyncCallbackContext, registerSignalEventHandler, runSignalEvents, SignalHandlerArgs } from "./signals-base";

const ANYMOVE_DELAY: DelayManager = 
    new DelayManager(1000, 1001, -1, -1) // no delay

const ACT_MONITOR_DELAY: DelayManager = 
    new DelayManager(10000, 1001, -1, -1) // no delay

export let INTERVAL1_ID: number;

export function _serviceCallbacks() {
    
    if (!checkEnable("obasync", {err: false, notice: false})) { return; }

    // MARK: anymove
    {
        const callbackID = '__obasync.obsidian.anymove';
        // OBA.registerEvent(
        //     OBA.app.workspace.on('editor-change', (...args) => {
        //         runObaCallbacks(callbackID)
        //     })
        // );
        // OBA.registerEvent(
        //     OBA.app.workspace.on('file-open', () => {
        //         runObaCallbacks(callbackID)
        //     })
        // );
        OBA.registerDomEvent(window.document, "mousemove", () => {
            runObaCallbacks(callbackID)
        });
        OBA.registerDomEvent(window.document, "click", () => {
            runObaCallbacks(callbackID)
        });
        OBA.registerDomEvent(window.document, "keyup", async () => {
            runObaCallbacks(callbackID)
        });

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

    // // auto sync
    // {
    //     // const callbackID = `obasync.obsidian.anymove`
    //     // registerObaCallback(
    //     //     callbackID, 
    //     //     async () => {
    //     //         const channelsConfig = getObaConfig("obasync.channels", {})
    //     //         for (const channelName in channelsConfig) {
    //     //             console.log("channelName: ", channelName)
    //     //             const channelConfig = channelsConfig?.[channelName] || {}
    //     //             const pushDepot = channelConfig?.["push.depot"] || null
    //     //             if (pushDepot) {
    //     //                 _spawnAddDummyAndCommitAndPush(
    //     //                     pushDepot, "manual.pushing", "123", 
    //     //                     { tout: 10 }
    //     //                 )
    //     //             }
    //     //             const pullDepots = channelConfig?.["pull.depots"] || []
    //     //             for (const pullDepot of pullDepots) {
    //     //                 _spawnFetchCheckoutPull(pullDepot, { tout: 10 })
    //     //             }
    //     //         }
    //     //     }
    //     // )
    // }

    {
        const callbackID = `obasync.obsidian.anymove`
        registerObaCallback(
            callbackID, 
            async () => {
                await _pullAndRunSignalEvents(true)
            }
        )
    }

    INTERVAL1_ID = window.setInterval(
        async () => {
            await _pullAndRunSignalEvents(true)

            ObaSyncScheduler.spawn({
                id: `autoPush`,
                deltaGas: 1,
                taskFun: async (task: TaskState) => {
                    const channelsConfig = getObaConfig("obasync.channels", {})
                    for (const channelName in channelsConfig) {
                        const channelConfig = channelsConfig[channelName]
                        const pushDepot = channelConfig?.["push.depot"] || null
                        if (!pushDepot) { continue; }
                        new Notice(`Pushing ${channelName}`, 2000)
                        await _addDummyAndCommit(pushDepot, "auto.commit.push", "123")
                        await _justPush(pushDepot, { tout: 10 })
                    }
                }
            })
            
        }, 
        20000
    );

    // publish.files
    OBA.registerEvent(
        OBA.app.workspace.on('editor-change', async (...args) => {
            console.clear()
            await _spawnModifiedFileSignal()
        })
    );

    // download.files
    _registerModifiedFilesHandler()

    // // MARK: activity mon
    // // {
    // //     const callbackID = `obasync.obsidian.anymove`
    // //     registerObaCallback(
    // //         callbackID, 
    // //         async () => {
    // //             const flag = await ACT_MONITOR_DELAY.manageTime()
    // //             if (flag != "go") { return; }
    // //             ObaSyncScheduler.spawn({
    // //                 id: `obasync.obsidian.anymove:sendActivityMonitorSignal`,
    // //                 taskFun: async (task: TaskState) => {
    // //                     console.clear()
    // //                     await _sendActivityMonitorSignal()
    // //                     if (task["gas"] > 1) {
    // //                         task["gas"] = 1
    // //                     }
    // //                 }
    // //             })
    // //         }
    // //     )
    // // }
}
    

// DONE/TAI: create per note delay manager
let SPAWN_MOD_FILE_DELAY: {[keys: string]: DelayManager} = {}
// const PUSHING_SET = new Set()

export async function _spawnModifiedFileSignal() {
    console.log("_spawnModifiedFileSignal")

    const localFile = getCurrNotePath()
    if (!localFile) { return; }
    const userName0 = getObaConfig("obasync.me", null)
    if (!userName0) { return; }

    // delay
    const delayManager = SPAWN_MOD_FILE_DELAY?.[localFile] 
        || new DelayManager(5000, 100, 5000, -1) // no delay
    const flag = await delayManager.manageTime()
    if (flag != 'go') { return; }

    ObaSyncScheduler.spawn({
        id: `publishFileVersion:${localFile}`,
        deltaGas: 1,
        taskFun: async (task: TaskState) => {
            const channelsConfig = getObaConfig("obasync.channels", {})
            console.log("channelsConfig: ", channelsConfig)
            const scope = await getNoteObaSyncScope(localFile, channelsConfig) || []
            console.log("scope: ", scope)
            for (const channelName of scope) {
                await _commitModifiedFileSignal(
                    localFile,
                    channelName,
                    userName0,
                    channelsConfig,
                )                
            }
            // clamp gas
            if (task["gas"] > 1) {
                task["gas"] = 1
            }
        }, 
    })
}

function _registerModifiedFilesHandler() {
    registerSignalEventHandler({
        eventID: "obasync.signal0.timetag.missing.or.older",  // new signal available
        signalType: "modified.file", 
        deltaGas: 1,
        taskIDDigFun: (
            context: ObaSyncCallbackContext
        ) => {
            // For doing unique the taskID
            const channelName = context["manIder"]["channelName"]
            const manType = context["manIder"]["manType"]
            const hashKey = context["signal1HashKey"]
            return [channelName, manType, hashKey]  as string[]
        },
        handler: async (arg: SignalHandlerArgs ): Promise<HandlingStatus> => {
            const context = arg["context"]
            const channelsConfig = getObaConfig("obasync.channels", {})
            
            // handle gas
            const task = arg["task"]
            task["gas"] = 0 // Do once

            return await _handleDownloadFile(context, channelsConfig)
        }
    })
}

function _handleActivityMonitorSignal(
    context: ObaSyncCallbackContext
): HandlingStatus {
    const signal = context?.["signal1"] || {}
    const token = signal?.["args"]?.["token"] || "Missing Token"
    const sender = signal?.["args"]?.["sender"] || "JonhDoe"
    new Notice(`Activity from ${sender}, token: ${token}`, 0)
    return "processed.ok"
}

// MARK: monitor
export async function _sendActivityMonitorSignal(
): Promise<HandlingStatus> {
    return; // DEV

    const userName0 = getObaConfig("obasync.me", null)
    const vaultDepot = getVaultDir()
    
    const channelsConfig = getObaConfig("obasync.channels", {})
    for (const channelName in channelsConfig) {
        console.log("channelName: ", channelName)
        const channelConfig = channelsConfig[channelName]
        const pushDepot = channelConfig?.["push.depot"] || null
        if (!pushDepot) { return "error" }
        console.log("pushDepot: ", pushDepot)
        
        await commitObaSyncSignal({
            vaultDepot,
            pushDepot,
            issuerName: userName0,
            channelName,
            manType: 'main',
            signalTemplate: { 
                "type": 'activity.monitor', 
                "args": {
                    "token": randstring(),
                    "sender": userName0,
                }
            },
            hashKey: null,
            hashDig: []
        })
    }
    return "processed.ok"
}


const PULL_AND_RUN_DELAY: DelayManager = 
    new DelayManager(10000, 500, 10000, -1) // no delay

export async function _pullAndRunSignalEvents(
    pull = true,
) {

    await PULL_AND_RUN_DELAY.manageTime({
        prewait: () => {
            ObaSyncScheduler.spawn({
                id: `pullAndProcessSignals.first`,
                deltaGas: 1,
                taskFun: async (task: TaskState) => {
                    // console.clear()
                    if(task["gas"] > 1) { task["gas"] = 1 }
                    await __pullAndRunSignalEvents(pull)
                    new Notice("pullAndProcessSignals.first", 2000)
                }
            })
        }, 
        ongo: () => {
            ObaSyncScheduler.spawn({
                id: `pullAndProcessSignals.last`,
                deltaGas: 100,
                taskFun: async (task: TaskState) => {
                    // console.clear()
                    if(task["gas"] > 100) { task["gas"] = 100}
                    if(task["gas"] > 0) { return; }
                    await __pullAndRunSignalEvents(pull)
                    new Notice("pullAndProcessSignals.last", 2000)
                }
            })
        }, 
        onwait: () => {
            console.log("tick")
        }, 
    })
    

}
async function __pullAndRunSignalEvents(
    pull = true,
) {
    console.log("__pullAndRunSignalEvents")
    const channelsConfig = getObaConfig("obasync.channels", {})
    const userName0 = getObaConfig("obasync.me", null)
    const vaultDepot = getVaultDir()
    for (const channelName in channelsConfig) {
        console.log("==============================")
        console.log("channelName: ", channelName)
        const channelConfig = channelsConfig?.[channelName] || {}
        console.log("channelConfig: ", channelConfig)
        const pushDepot = channelConfig?.["push.depot"] || null
        console.log("pushDepot: ", pushDepot)
        const pullDepots = channelConfig?.["pull.depots"] || []
        console.log("pullDepots: ", pullDepots)
        for (const pullDepot of pullDepots) {
            console.log("------------------------------")
            console.log("pullDepot: ", pullDepot)
            // pull
            if (pull) {
                console.log("------------------------------")
                console.log("_fetchCheckoutPull")
                await _fetchCheckoutPull(pullDepot, { tout: 10 }) 
            }
            // process
            console.log("------------------------------")
            console.log("runSignalEvents")
            await runSignalEvents({
                vaultDepot, pushDepot, pullDepot,
                manType: 'main',
                userName0,
                channelName
            })

        }
    }
}