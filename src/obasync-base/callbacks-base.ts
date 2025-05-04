import { Notice } from "obsidian";
import { OBA } from "src/oba-base/globals";
import { getObaConfig } from "src/oba-base/obaconfig";
import { registerObaEventCallback, runObaEventCallbacks } from "src/scheduler-base/event-callbacks";
import { getCurrNotePath } from "src/tools-base/obsidian-tools";
import { TaskState, TriggerManager } from "src/tools-base/schedule-tools";
import { _justPush } from "./git-cli-base";
import { _handleDownloadFile, publishModifiedFileSignal } from "./modifiedFileSignal-base";
import { getObaSyncFlag } from "./obasync-base";
import { getNoteObaSyncScope } from "./scope-base";
import { HandlingStatus, ObaSyncCallbackContext, pushAllChannels, registerSignalEventHandler, resolveSignalEventsAllChannles, SignalHandlerArgs } from "./signals-base";
import { spawnObaSeqCallback } from "src/scheduler-base/seq-callbacks";
import { ObaSchedulerTaskFunArgs } from "src/scheduler-base/scheduler-base";

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
        registerObaEventCallback({
            blockID: `obasync.obsidian.anymove`, 
            taskPriority: 3,
            async callback() {
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
            
            spawnObaSeqCallback({
                blockID: `automatic.sync`,
                context: {}, 
                callback: async (args: ObaSchedulerTaskFunArgs) => {
                    const block = args["execBlock"]

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

                    block["blockGas"] = 0
                    return;
                }
            })
        }, 
        getObaConfig("obasync.auto.sync.period", 3 * 1000 * 60)
    );
}

// MARK: _registerAnyMove
const ANYMOVE_DELAY = new TriggerManager() 
function _registerAnyMove() {
    {
        const blockID = '__obasync.obsidian.anymove';
        OBA.registerDomEvent(window.document, "mousemove", () => {
            runObaEventCallbacks({blockID, context: null})
        });
        OBA.registerDomEvent(window.document, "click", () => {
            runObaEventCallbacks({blockID, context: null})
        });
        OBA.registerDomEvent(window.document, "keyup", async () => {
            runObaEventCallbacks({blockID, context: null})
        });

        
        registerObaEventCallback({
            blockID, 
            async callback() {
                await ANYMOVE_DELAY.manage({
                    delayTime: -1,
                    ignoreTime: 300,
                    sleepTime: 50,
                    async ongo() {
                        runObaEventCallbacks({
                            blockID: 'obasync.obsidian.anymove', 
                            context: null
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

            spawnObaSeqCallback({
                blockID: `publishFileVersion:${vaultFile}:push`,
                context: { vaultFile }, 
                callback: async (args: ObaSchedulerTaskFunArgs) => {
                    // TODO/ extract as a function and communicate only using context
                    const block = args["execBlock"]
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
                    block["blockGas"] = 0
                }
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
            spawnObaSeqCallback({
                blockID: `pullAndProcessSignals.first`,
                context: {}, 
                callback: async (args: ObaSchedulerTaskFunArgs) => {
                    // TODO/ extract as a function and communicate only using context
                    const block = args["execBlock"]
                    // console.clear()
                    if(block["blockGas"] > 1) { block["blockGas"] = 1 }
                    await resolveSignalEventsAllChannles({
                        commitVaultDepo: true,
                        pullVaultRepo: false,
                        notify: false,
                    })
                }
            })
        }, 
        ongo: () => {

            // TODO/ reimplement
            spawnObaSeqCallback({
                blockID: `pullAndProcessSignals.last`,
                context: {}, 
                blockGas: 100,
                callback: async (args: ObaSchedulerTaskFunArgs) => {
                    // TODO/ extract as a function and communicate only using context
                    const block = args["execBlock"]
                    // console.clear()
                    if(block["blockGas"] > 100) { block["blockGas"] = 100}
                    if(block["blockGas"] > 0) { return; }
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

