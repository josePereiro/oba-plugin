import { Notice } from "obsidian";
import { getObaConfig } from "src/oba-base/obaconfig";
import { checkEnable } from "src/tools-base/oba-tools";
import { getVaultDir } from "src/tools-base/obsidian-tools";
import { TaskState } from "src/tools-base/schedule-tools";
import { DelayManager } from "src/tools-base/utils-tools";
import { _addDummyAndCommitAndPush, _fetchCheckoutPull } from "./channels-base";
import { _handleDownloadFile } from "./modifiedFileSignal-base";
import { ObaSyncScheduler } from "./obasync";
import { HandlingStatus, ObaSyncCallbackContext, registerSignalEventHandler, runSignalEvents, SignalHandlerArgs } from "./signals-base";

const ANYMOVE_DELAY: DelayManager = 
    new DelayManager(1000, 1001, -1, -1) // no delay

const ACT_MONITOR_DELAY: DelayManager = 
    new DelayManager(10000, 1001, -1, -1) // no delay

export let INTERVAL1_ID: number;

export function _serviceCallbacks() {
    
    if (!checkEnable("obasync", {err: false, notice: false})) { return; }

    // MARK: anymove
    // {
    //     const callbackID = '__obasync.obsidian.anymove';
    //     // OBA.registerEvent(
    //     //     OBA.app.workspace.on('editor-change', (...args) => {
    //     //         runObaCallbacks(callbackID)
    //     //     })
    //     // );
    //     // OBA.registerEvent(
    //     //     OBA.app.workspace.on('file-open', () => {
    //     //         runObaCallbacks(callbackID)
    //     //     })
    //     // );
    //     OBA.registerDomEvent(window.document, "mousemove", () => {
    //         runObaCallbacks(callbackID)
    //     });
    //     OBA.registerDomEvent(window.document, "click", () => {
    //         runObaCallbacks(callbackID)
    //     });
    //     OBA.registerDomEvent(window.document, "keyup", async () => {
    //         runObaCallbacks(callbackID)
    //     });

    //     registerObaCallback(
    //         callbackID, 
    //         async () => {
    //             const now: Date = new Date()
    //             const flag = await ANYMOVE_DELAY.manageTime()
    //             if (flag != "go") { return; }
    //             await runObaCallbacks('obasync.obsidian.anymove')
    //         }
    //     )
    // }

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

    // {
    //     const callbackID = `obasync.obsidian.anymove`
    //     registerObaCallback(
    //         callbackID, 
    //         async () => {
    //             await _pullAndRunSignalEventsCallback(true)
    //         }
    //     )
    // }

    INTERVAL1_ID = window.setInterval(
        async () => {
            // run signals
            ObaSyncScheduler.spawn({
                id: `pullAndProcessSignals.base`,
                deltaGas: 1,
                taskFun: async (task: TaskState) => {
                    // console.clear()
                    await runSignalEventsAll(true)
                    new Notice(`Auto pulling`, 1000)
                    task["gas"] = 0
                }
            })

            // push channels
            ObaSyncScheduler.spawn({
                id: `autoPush`,
                deltaGas: 1,
                taskFun: async (task: TaskState) => {
                    new Notice(`Auto pushing`, 1000)
                    const channelsConfig = getObaConfig("obasync.channels", {})
                    for (const channelName in channelsConfig) {
                        const channelConfig = channelsConfig[channelName]
                        const pushDepot = channelConfig?.["push.depot"] || null
                        if (!pushDepot) { continue; }
                        await _addDummyAndCommitAndPush(
                            pushDepot, "auto.commit.push", "123", 
                            { tout: 10 }
                        )
                        task["gas"] = 0
                    }
                }
            })
        }, 
        getObaConfig("obasync.auto.sync.period", 3 * 1000 * 60)
    );

    // publish.files
    // OBA.registerEvent(
    //     OBA.app.workspace.on('editor-change', async (...args) => {
    //         console.clear()
    //         const localFile = getCurrNotePath()
    //         if (!localFile) { return; }

    //         // delay
    //         const delayManager = SPAWN_MOD_FILE_DELAY?.[localFile] 
    //             || new DelayManager(5000, 100, 5000, -1) // no delay
    //         const flag = await delayManager.manageTime()
    //         if (flag != 'go') { return; }

    //         await _spawnModifiedFileSignal(localFile, { checkPulledMTime: true })
    //     })
    // );

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

// deltaGas?: number,
// taskIDDigFun?: (context: ObaSyncCallbackContext) => string[]

function _registerModifiedFilesHandler() {
    const handlerName = getObaConfig("obasync.me", null)
    if (!handlerName) { return; }
    registerSignalEventHandler({
        eventID: "obasync.vault.signal.ctimetag.missing.or.older",  // new signal available,
        handlerName,
        signalType: "modified.file", 
        deltaGas: 1,
        taskIDDigFun: (
            context: ObaSyncCallbackContext
        ) => {
            // For doing unique the taskID
            const channelName = context["manIder"]["channelName"]
            const manType = context["manIder"]["manType"]
            const pulledSignalKey = context["pulledSignalKey"]
            return [channelName, manType, pulledSignalKey] as string[]
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

const PULL_AND_RUN_DELAY: DelayManager = 
    new DelayManager(10000, 500, 10000, -1) // no delay

export async function _pullAndRunSignalEventsCallback(
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
                    await runSignalEventsAll(pull)
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
                    await runSignalEventsAll(pull)
                    new Notice("pullAndProcessSignals.last", 2000)
                }
            })
        }, 
        onwait: () => {
            console.log("tick")
        }, 
    })
    

}

export async function runSignalEventsAll(
    pull = true,
) {
    console.log("runSignalEventsAll")
    const channelsConfig = getObaConfig("obasync.channels", {})
    const vaultUserName = getObaConfig("obasync.me", null)
    const vaultDepot = getVaultDir()
    for (const channelName in channelsConfig) {
        console.log("==============================")
        console.log("runSignalEventsAll:channelName: ", channelName)
        const channelConfig = channelsConfig?.[channelName] || {}
        console.log("runSignalEventsAll:channelConfig: ", channelConfig)
        const pushDepot = channelConfig?.["push.depot"] || null
        console.log("runSignalEventsAll:pushDepot: ", pushDepot)
        const pullDepots = channelConfig?.["pull.depots"] || []
        console.log("runSignalEventsAll:pullDepots: ", pullDepots)
        for (const pullDepot of pullDepots) {
            console.log("------------------------------")
            console.log("runSignalEventsAll:pullDepot: ", pullDepot)
            // pull
            if (pull) {
                console.log("------------------------------")
                console.log("runSignalEventsAll:_fetchCheckoutPull")
                await _fetchCheckoutPull(pullDepot, { tout: 10 }) 
            }
            // process
            console.log("------------------------------")
            console.log("runSignalEventsAll:runSignalEvents")
            await runSignalEvents({
                vaultDepot, pushDepot, pullDepot,
                manType: 'main',
                vaultUserName,
                channelName
            })

        }
    }
}