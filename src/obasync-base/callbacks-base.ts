import { Notice } from "obsidian";
import { OBA, ObaScheduler } from "src/oba-base/globals";
import { getObaConfig } from "src/oba-base/obaconfig";
import { registerObaCallback, runObaCallbacks } from "src/services-base/callbacks";
import { checkEnable } from "src/tools-base/oba-tools";
import { getCurrNotePath } from "src/tools-base/obsidian-tools";
import { TaskState, TriggerManager } from "src/tools-base/schedule-tools";
import { _justPush, _spawnAddDummyAndCommitAndPush, _spawnFetchCheckoutPull } from "./git-cli-base";
import { _handleDownloadFile, publishModifiedFileSignal } from "./modifiedFileSignal-base";
import { getObaSyncFlag } from "./obasync-base";
import { getNoteObaSyncScope } from "./scope-base";
import { HandlingStatus, ObaSyncCallbackContext, pushAllChannels, registerSignalEventHandler, resolveSignalEventsAllChannles, SignalHandlerArgs } from "./signals-base";

// MARK: main
export function _serviceCallbacks() {
    
    // if (!checkEnable("obasync", {err: false, notice: false})) { return; }

    // _registerAnyMove()
    // _registerAutoSyncOnAnyMove()
    // _autoSyncOninterval()
    _registerModifiedFilesHandler()
}

// MARK: _resolveAtANyMove
function _resolveAtANyMove() {
    {
        const callbackID = `obasync.obsidian.anymove`
        registerObaCallback({
            callbackID, 
            async call() {
                await _resolveVaultAtAnyMove()
            }
        })
    }
}

// MARK: _autoSyncOninterval
export let INTERVAL1_ID: number;
function _autoSyncOninterval() {
    INTERVAL1_ID = window.setInterval(

        async () => {
            // run signals
            
            ObaScheduler.spawn({
                id: `automatic.sync`,
                deltaGas: 1,
                taskFun: async (task: TaskState) => {

                    // push
                    new Notice(`Auto pushing`, 1000)
                    await pushAllChannels({
                        commitMsg: "auto.commit.push",
                        commitPushRepo: true,
                        pushPushRepo: getObaSyncFlag(`online.mode`, false),
                    })
                    
                    // pull/run
                    new Notice(`Auto pulling/resolving`, 1000)
                    await resolveSignalEventsAllChannles({
                        commitVaultDepo: true,
                        pullVaultRepo: getObaSyncFlag(`online.mode`, false),
                        notify: true,
                    })

                    task["gas"] = 0
                }
            })
        }, 
        getObaConfig("obasync.auto.sync.period", 3 * 1000 * 60)
    );
}

// MARK: _registerAutoSyncOnAnyMove
function _registerAutoSyncOnAnyMove() {
    // auto sync
    {
        const callbackID = `obasync.obsidian.anymove`
        registerObaCallback({
            callbackID, 
            async call() {
                const channelsConfig = getObaConfig("obasync.channels", {})
                for (const channelName in channelsConfig) {
                    console.log("channelName: ", channelName)
                    const channelConfig = channelsConfig?.[channelName] || {}
                    const pushDepot = channelConfig?.["push.depot"] || null
                    if (pushDepot) {
                        await _spawnAddDummyAndCommitAndPush(
                            pushDepot, "manual.pushing", "123", 
                            { tout: 10 }
                        )
                    }
                    const pullDepots = channelConfig?.["pull.depots"] || []
                    for (const pullDepot of pullDepots) {
                        await _spawnFetchCheckoutPull(pullDepot, { tout: 10 })
                    }
                }
            }
        })
    }
}

// MARK: _registerAnyMove
const ANYMOVE_DELAY = new TriggerManager() 
function _registerAnyMove() {
    {
        const callbackID = '__obasync.obsidian.anymove';
        OBA.registerDomEvent(window.document, "mousemove", () => {
            runObaCallbacks({callbackID})
        });
        OBA.registerDomEvent(window.document, "click", () => {
            runObaCallbacks({callbackID})
        });
        OBA.registerDomEvent(window.document, "keyup", async () => {
            runObaCallbacks({callbackID})
        });

        registerObaCallback({
            callbackID, 
            async call() {
                await ANYMOVE_DELAY.manage({
                    delayTime: -1,
                    ignoreTime: 300,
                    sleepTime: 50,
                    async ongo() {
                        await runObaCallbacks({
                            callbackID: 'obasync.obsidian.anymove',
                            _verbose: true
                        })
                    },
                })
            }
        })
    }
}

// MARK: _registerModifiedFilesHandler
function _registerModifiedFilesHandler(
) {
    const handlerName = getObaConfig("obasync.me", null)
    console.log("_registerModifiedFilesHandler:handlerName", handlerName)
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
            console.log("_registerModifiedFilesHandler:handler")
            const context = arg["context"]
            console.log("_registerModifiedFilesHandler:context", context)
            const channelsConfig = getObaConfig("obasync.channels", {})
            console.log("_registerModifiedFilesHandler:channelsConfig", channelsConfig)
            
            // handle gas
            const task = arg["task"]
            task["gas"] = 0 // Do once
            console.log("_registerModifiedFilesHandler:task", task)

            return await _handleDownloadFile({
                context,
                channelsConfig,
                controlArgs: {
                    commitPushRepo: true,
                    commitVaultRepo: true,
                    pushPushRepo: getObaSyncFlag(`online.mode`, false),
                    notify: true
                }
            })
        }
    })
}


// MARK: _handleModFileOnChange
const ONEDIT_SPAWN_MOD_FILE_TIME = new TriggerManager()
function _handleModFileOnChange() {
    // publish.files
    OBA.registerEvent(
        OBA.app.workspace.on('editor-change', async (...args) => {
            console.clear()
            
            // delay for saving
            const flag = await ONEDIT_SPAWN_MOD_FILE_TIME.manage({
                delayTime: 5000,
                ignoreTime: 5000,
                sleepTime: 200
            })
            if (flag != 'go') { return; }

            const vaultFile = getCurrNotePath()
            if (!vaultFile) { return; }

            ObaScheduler.spawn({
                id: `publishFileVersion:${vaultFile}:push`,
                deltaGas: 1,
                taskFun: async (task: TaskState) => {
                    const committerName = getObaConfig("obasync.me", null)
                    if (!committerName) { return; }
                    const channelsConfig = getObaConfig("obasync.channels", {})
                    const scope = await getNoteObaSyncScope(vaultFile, channelsConfig) || []
                    // commit all
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
                                pushPushRepo: false, // always offline (push later)
                                notify: false
                            }
                        })
                    }

                    // push all anyway(?)
                    if (getObaSyncFlag(`online.mode`, false)) {
                        for (const channelName of scope) {
                            const pushDepot = channelsConfig?.[channelName]?.["push.depot"] || null
                            if (!pushDepot) { continue; }
                            await _justPush(pushDepot, {tout: 30})
                            console.log(`Pushed ${channelName}`)
                            new Notice(`Pushed ${channelName}`, 1000)
                        }
                    }

                    // relove/pull
                    await resolveSignalEventsAllChannles({
                        commitVaultDepo: true,
                        pullVaultRepo: getObaSyncFlag(`online.mode`, false),
                        notify: true,
                    })

                    // clamp gas
                    task["gas"] = 0
                }, 
            })
        })
    );
}

// MARK: _resolveVaultAtAnyMove
const PULL_AND_RUN_DELAY = new TriggerManager() // no delay

export async function _resolveVaultAtAnyMove() {

    await PULL_AND_RUN_DELAY.manage({
        delayTime: 10000,
        ignoreTime: 10000,
        sleepTime: 500,
        prewait: () => {
            ObaScheduler.spawn({
                id: `pullAndProcessSignals.first`,
                deltaGas: 1,
                taskFun: async (task: TaskState) => {
                    // console.clear()
                    if(task["gas"] > 1) { task["gas"] = 1 }
                    await resolveSignalEventsAllChannles({
                        commitVaultDepo: true,
                        pullVaultRepo: false,
                        notify: false,
                    })
                }
            })
        }, 
        ongo: () => {
            ObaScheduler.spawn({
                id: `pullAndProcessSignals.last`,
                deltaGas: 100,
                taskFun: async (task: TaskState) => {
                    // console.clear()
                    if(task["gas"] > 100) { task["gas"] = 100}
                    if(task["gas"] > 0) { return; }
                    await resolveSignalEventsAllChannles({
                        commitVaultDepo: true,
                        pullVaultRepo: false,
                        notify: false,
                    })
                }
            })
        }, 
        onwait: () => {
            // console.log("tick")
        }, 
    })
    

}

