// import { Notice } from "obsidian"
// import { addObaCommand } from "src/oba-base/commands"
// import { getObaConfig } from "src/oba-base/obaconfig"
// import { ObaSchedulerTaskFunArgs } from "src/scheduler-base/scheduler-base"
// import { spawnObaSeqCallback } from "src/scheduler-base/seq-callbacks"
// import { getCurrNotePath } from "src/tools-base/obsidian-tools"
// import { TriggerManager } from "src/tools-base/schedule-tools"
// import { publishModifiedFileSignal } from "./modifiedFileSignal-base"
// import { getObaSyncFlag, setObaSyncFlag } from "./obasync-base"
// import { getNoteObaSyncScope } from "./scope-base"
// import { resolveSignalEventsAllChannles } from "./signals-base"


// const COMMAND_SPAWN_MOD_FILE_TIME = new TriggerManager()

// export function _serviceCommands() {

//     // MARK: spawn modified file signal
//     addObaCommand({
//         commandName: "spawn modified file signal",
//         serviceName: ["ObaSync"],
//         async commandCallback({ commandID, commandFullName }) {

//             // delay for saving
//             const flag = 
//                 // 300, 100, -1, -1
//                 await COMMAND_SPAWN_MOD_FILE_TIME.manage({
//                     ignoreTime: 300,
//                     sleepTime: 100,
//                     delayTime: -1,
//                 })
//             if (flag != 'go') { return; }

//             console.clear()
//             const vaultFile = getCurrNotePath()
//             if (!vaultFile) { return; }

//             spawnObaSeqCallback({
//                 blockID: `oba-obasync-spawnModifiedFileSignal:${vaultFile}`,
//                 context: {}, 
//                 blockGas: 1,
//                 callback: async (args: ObaSchedulerTaskFunArgs) => {
//                     // TODO/ extract as a function and communicate only using context
//                     const block = args["execBlock"]
//                     const committerName = getObaConfig("obasync.me", null)
//                     if (!committerName) { return; }
//                     const channelsConfig = getObaConfig("obasync.channels", {})
//                     console.log("channelsConfig: ", channelsConfig)
//                     const scope = await getNoteObaSyncScope(vaultFile, channelsConfig) || []
//                     console.log("scope: ", scope)
//                     for (const channelName of scope) {
//                         // TODO/ Think how to include man type in configuration
//                         // or think how to discover them from disk...
//                         const manIder = {channelName, manType: 'main'} 
//                         await publishModifiedFileSignal({
//                             vaultFile,
//                             manIder,
//                             committerName,
//                             channelsConfig,
//                             checkPulledMTime: false,
//                             controlArgs: {
//                                 commitVaultRepo: true,
//                                 commitPushRepo: true,
//                                 pushPushRepo: getObaSyncFlag(`online.mode`, false),
//                                 notify: true
//                             }
//                         })
//                     }
//                     // clamp gas
//                     if (block["blockGas"] > 1) {
//                         block["blockGas"] = 1
//                     }
//                 }
//             })
//         },
//     })

//     // MARK: spawn resolve vault signal events
//     addObaCommand({
//         commandName: "spawn resolve vault signal events",
//         serviceName: ["ObaSync"],
//         async commandCallback({ commandID, commandFullName }) {
//             spawnObaSeqCallback({
//                 blockID: `oba-obasync-spawnResolveVaultSignalEvents`,
//                 context: {}, 
//                 blockGas: 1,
//                 callback: async (args: ObaSchedulerTaskFunArgs) => {
//                     // TODO/ extract as a function and communicate only using context
//                     const block = args["execBlock"]
//                     await resolveSignalEventsAllChannles({
//                         commitVaultDepo: true,
//                         pullVaultRepo: getObaSyncFlag(`online.mode`, false),
//                         notify: true,
//                     })
//                     block["blockGas"] = 0
//                 }
//             })
//         },
//     })
    
//     // MARK: flip online mode
//     addObaCommand({
//         commandName: "flip online mode",
//         serviceName: ["ObaSync"],
//         async commandCallback({ commandID, commandFullName }) {
            
//              // set flags
//              setObaSyncFlag(`online.mode`, 
//                 !getObaSyncFlag(`online.mode`, false)
//             )
//             new Notice(`ObaSync online mode: ${getObaSyncFlag(`online.mode`, false)}`, 1000)
//         },
//     })

//     // MARK: push-all
//     addObaCommand({
//         commandName: "push-all",
//         serviceName: ["ObaSync"],
//         async commandCallback({ commandID, commandFullName }) {
//             // spawn push
//             spawnObaSeqCallback({
//                 blockID: `oba-obasync-push-all`,
//                 context: {}, 
//                 blockGas: 100,
//                 callback: async (args: ObaSchedulerTaskFunArgs) => {
//                     // TODO/ extract as a function and communicate only using context
//                     const block = args["execBlock"]
//                     if (block["blockGas"] > 100) {
//                         block["blockGas"] = 100
//                     }
//                     // run at the end
//                     if (block["blockGas"] > 0) {
//                         return
//                     }
                        
//                     const channelsConfig = getObaConfig("obasync.channels", {})
//                     for (const channelName in channelsConfig) {
//                         const pushDepot = channelsConfig[channelName]["push.depot"]
//                         await _justPush(pushDepot, {tout: 30})
//                         console.log(`Pushed ${channelName}`)
//                         new Notice(`Pushed ${channelName}`, 1000)
//                     }

//                     block["blockGas"] = 0
//                 }
//             })
//         },
//     })
// }