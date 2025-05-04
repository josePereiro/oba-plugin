// import { copyFileSync } from "fs"
// import { Notice } from "obsidian"
// import { getObaConfig } from "src/oba-base/obaconfig"
// import { registerObaEventCallback, runObaEventCallbacks } from "src/scheduler-base/event-callbacks"
// import { ObaSchedulerExecutionBlock, ObaSchedulerTask } from "src/scheduler-base/scheduler-base"
// import { getVaultDir } from "src/tools-base/obsidian-tools"
// import { TaskState } from "src/tools-base/schedule-tools"
// import { hash64Chain } from "src/tools-base/utils-tools"
// import { checkPusher, manifestJsonIO, modifyObaSyncManifest, ObaSyncManifest, ObaSyncManifestIder } from "./manifests-base"
// import { utcTimeTag } from "./utils-base"

// // MARK: ObaSyncSignal
// export type HandlingStatus = "handler.ok" | "unhandled" | "unknown" | "error" | null
// export interface ObaSyncSignal {
//     "type": string,

//     "creator.timestamp"?: string,
//     "creator.hashKey"?: string,
//     "creator.name"?: string,
//     "creator.channelName"?: string,
    
//     "committer.name"?: string,
//     "committer.timestamp"?: string,
//     "committer.channelName"?: string,
    
//     "handler.name"?: string
//     "handler.callback"?: string
//     "handler.timestamp"?: string,
//     "handler.handlingStatus"?: HandlingStatus
//     "handler.channelName"?: string,
    
//     "args"?: {[keys: string]: any} 
// }

// // MARK: ObaSyncCallbackContext
// export interface ObaSyncCallbackContext {
//     "vaultUserName": string,
//     "pulledUserName": string,
//     "vaultDepot": string,
//     "pullDepot": string,
//     "pushDepot": string,
//     "manIder": ObaSyncManifestIder,
//     "pulledSignalKey": string,
//     "pulledSignal": ObaSyncSignal | null,
//     "eventID"?: string,
//     "args"?: {[keys: string]: any} | null
// }

// // MARK: _signalHashKey
// function _signalHashKey(val0: string, ...vals: string[]) {
//     const hash = hash64Chain(val0, ...vals)
//     return hash
// }

// /*
//     This is an offline method
// */ 

// // MARK: ObaSyncPublishControlArgs
// export interface ObaSyncPublishControlArgs {
//     commitPushRepo: boolean,
//     commitVaultRepo: boolean,
//     pushPushRepo: boolean,
//     notify: boolean
// }

// // MARK: _publishSignalArgs
// export interface _publishSignalArgs extends ObaSyncPublishControlArgs {
//     vaultDepot: string,
//     pushDepot: string,
//     committerName: string,
//     manIder: ObaSyncManifestIder,
//     signalTemplate: ObaSyncSignal,
//     hashDig: string[],
//     callback?: (() => any)
// }

// // MARK: publishSignal
// export async function publishSignal({
//     vaultDepot,
//     pushDepot,
//     committerName,
//     manIder,
//     signalTemplate,
//     hashDig,
//     commitPushRepo,
//     commitVaultRepo,
//     pushPushRepo,
//     notify,
//     callback = () => null,
// }: _publishSignalArgs ) {

//     // checkpoint vault
//     if (commitVaultRepo) {
//         await _addDummyAndCommit(vaultDepot, "pre.publish.signal", "123")
//     }
//     if (commitPushRepo) {
//         await _addDummyAndCommit(pushDepot, "pre.publish.signal", "123")
//     }

//     // mod vault manifest
//     const vManIO = manifestJsonIO(vaultDepot, manIder)
//     const signalType = signalTemplate["type"]

//     let signal = signalTemplate;
//     modifyObaSyncManifest({
//         manJIO: vManIO,
//         manIder,
//         userName: committerName,
//         onmod(manContent: ObaSyncManifest) {
//             // new
//             // 'type': string,
            
//             // 'creator.timestamp'?: string,
//             signalTemplate['creator.timestamp'] = 
//                 signalTemplate?.['creator.timestamp'] ||
//                 utcTimeTag()
//             // 'creator.hashKey'?: string,
//             const hashKey = signalTemplate['creator.hashKey'] = 
//                 signalTemplate?.['creator.hashKey'] ||
//                 _signalHashKey(signalType, ...hashDig)
//                 // _signalHashKey(committerName, channelName, signalType, ...hashDig)
//                 // NOTE: this was creating |committerNames| x |channelNames| x |signalTypes|
//                 // 'different' signals
//                 // If you want a signal to be unique per committerNames and channelNames
//                 // you can just add it to hashDig
//             // 'creator.name'?: string,
//             signalTemplate['creator.name'] = 
//                 signalTemplate?.['creator.name'] ||
//                 committerName
//             // 'creator.channelName'?: string,
//             signalTemplate['creator.channelName'] = 
//                 signalTemplate?.['creator.channelName'] ||
//                 manIder["channelName"]

//             // 'committer.name'?: string,
//             signalTemplate['committer.name'] = committerName
//             // 'committer.timestamp'?: string,
//             signalTemplate['committer.timestamp'] = utcTimeTag()
//             // 'committer.channelName'?: string,
//             signalTemplate['committer.channelName'] = manIder["channelName"]

//             // add to signals
//             manContent['signals'] = manContent?.['signals'] || {}
//             manContent['signals'][hashKey] = signalTemplate
//             return signalTemplate
//         },
//     })
    
//     // setup push depot
//     // check pusher
//     const rManIO = manifestJsonIO(pushDepot, manIder)
//     if (!checkPusher(manIder, rManIO)) { return null; }

//             // callback
//             const flag = await callback()
//             if (flag == 'abort') { return null; }

//     // copy vault manifest to push depot
//     console.log(`Copying manifests`)
//     const srcManFile = vManIO.retFile()
//     const destManFile = rManIO.retFile()
//     copyFileSync(srcManFile, destManFile)
//     console.log(`Copied ${srcManFile} -> ${destManFile}`)
//     console.log(`vaultMan: `, vManIO.loadd({}).retDepot())
//     console.log(`pulledMan: `, rManIO.loadd({}).retDepot())

//     // git add/commit
//     if (commitPushRepo) {
//         await _addDummyAndCommit(pushDepot, "post.publish.signal", "123")
//     }

//     if (pushPushRepo) {
//         await _justPush(pushDepot, { tout: 10 })
//     }

//             if (notify) { 
//                 const msg = [
//                     `Signal committed`,
//             ` - type: ${signal["type"]}`,
//             ` - committer.name: ${signal["committer.name"]}`,
//             ` - committer.channelName: ${signal["committer.channelName"]}`,
//             ` - creator.hashKey: ${signal["creator.hashKey"]}`,
//             ` - creator.name: ${signal["creator.name"]}`,
//             ` - creator.channelName: ${signal["creator.channelName"]}`,
//             ` - creator.timestamp: ${signal["creator.timestamp"]}`,
//                 ].join("\n")
//                 console.log(msg)
//         console.log('Committed signal: ', signal)
//                 new Notice(msg, 1 * 60 * 1000)
//             }
    
//     return signal
// }

// // MARK: pushAllChannels
// export async function pushAllChannels({
//     commitMsg = "push.all.channels",
//     commitPushRepo = true,
//     pushPushRepo = true,
// }: {
//     commitMsg?: string,
//     commitPushRepo?: boolean,
//     pushPushRepo?: boolean,
// }) {
//     const channelsConfig = getObaConfig("obasync.channels", {})
//     for (const channelName in channelsConfig) {
//         const channelConfig = channelsConfig[channelName]
//         const pushDepot = channelConfig?.["push.depot"] || null
//         if (!pushDepot) { continue; }
//         if (commitPushRepo) await _addDummyAndCommit(pushDepot, commitMsg, "123")
//         if (pushPushRepo) await _justPush(pushDepot, { tout: 10 })
//     }
// }

// // MARK: _resolveSignalControlArgs
// export interface _resolveSignalControlArgs {
//     commitVaultDepo: boolean,
//     pullVaultRepo: boolean,
//     notify: boolean
// }

// // MARK: resolveSignalEventsArgs
// interface resolveSignalEventsArgs extends _resolveSignalControlArgs {
//     vaultDepot: string,
//     pushDepot: string,
//     pullDepot: string,
//     vaultUserName: string, 
//     channelName: string, 
//     manType: string
// }

// // MARK: SignalEventCallbackArgs
// export interface SignalEventCallbackArgs {
//     context: ObaSyncCallbackContext, 
//     eventID: ObaSyncEventID
// }

// // MARK: ObaSyncEventID
// export type ObaSyncEventID =
//     `obasync.vault.signal.missing` |
//     `obasync.signals.both.ctimetags.present` | 
//     `obasync.vault.signal.ctimetag.newer` | 
//     `obasync.vault.signal.ctimetag.missing.or.newer` | 
//     `obasync.signals.both.ctimetags.equal` | 
//     `obasync.vault.signal.ctimetag.older` | 
//     `obasync.vault.signal.ctimetag.missing.or.older` |
//     `obasync.vault.signal.ctimetag.missing` | 
//     `obasync.pulled.signal.ctimetag.missing` | 
//     `obasync.signals.both.ctimetags.missing`


// // MARK: resolveSignalEvents
// /*
//     Check manifests and run event callbacks
// */ 
// export async function resolveSignalEvents({
//     vaultDepot,
//     pushDepot,
//     pullDepot,
//     vaultUserName, 
//     channelName, 
//     manType,
//     commitVaultDepo,
//     pullVaultRepo,
//     notify // TODO
// }: resolveSignalEventsArgs) {

//     // checkpoint vault
//     if (commitVaultDepo) {
//         await _addDummyAndCommit(vaultDepot, "obasync.pre.resolve.signal.event", "123")
//     }
//     if (pullVaultRepo) {
//         await _fetchCheckoutPull(pullDepot, { tout: 10 }) 
//     }

//     // load manifests
//     const manIder = { channelName, manType }
//     console.log("manIder: ", manIder)
//     const vaultManJIO = manifestJsonIO(vaultDepot, manIder)
//     const vaultMan: ObaSyncManifest = vaultManJIO.loaddOnDemand({}).retDepot()
//     const vaultManSignals = vaultMan['signals'] = vaultMan?.['signals'] || {}
//     console.log("vaultManSignals: ", vaultManSignals)

//     const pulledManJIO = manifestJsonIO(pullDepot, manIder)
//     const pulledMan: ObaSyncManifest = pulledManJIO.loaddOnDemand({}).retDepot()
//     const pulledUserName = pulledMan?.['meta']?.["userName"] || "JohnDoe"
//     const pulledManSignals = pulledMan['signals'] = pulledMan?.['signals'] || {}
//     console.log("pulledManSignals: ", pulledManSignals)
    
//     // handle issued signals
//     let blockID;
//     let eventID: ObaSyncEventID;

//     for (const pulledSignalKey in pulledManSignals) {
//         console.log("------------")
//         console.log("resolveSignalEvents:pulledSignalKey: ", pulledSignalKey)
        
//         // signal content
//         const pulledSignal: ObaSyncSignal = pulledManSignals[pulledSignalKey]
//         console.log("resolveSignalEvents:pulledSignal: ", pulledSignal)
//         const pulledSignalType = pulledSignal['type']
//         console.log("resolveSignalEvents:pulledSignalType: ", pulledSignalType)
        
//         // get record
//         let vaultSignal = vaultManSignals?.[pulledSignalKey]
//         console.log("resolveSignalEvents:vaultSignal: ", vaultSignal)

//         // call context
//         const context: ObaSyncCallbackContext = {
//             manIder, vaultUserName, pulledUserName, 
//             pulledSignalKey, pulledSignal, 
//             vaultDepot, pullDepot, pushDepot
//         }
//         console.log("resolveSignalEvents:context: ", context)

//         // callback
//         if (!vaultSignal) {
//             // run callbacks
//             eventID = context["eventID"] = `obasync.vault.signal.missing`
//             blockID = `${eventID}:${pulledSignalType}`
//             runObaEventCallbacks({ blockID, context})
//             eventID = context["eventID"] = `obasync.vault.signal.ctimetag.missing.or.newer`
//             blockID = `${eventID}:${pulledSignalType}`
//             runObaEventCallbacks({ blockID, context})
//             eventID = context["eventID"] = `obasync.vault.signal.ctimetag.missing.or.older`
//             blockID = `${eventID}:${pulledSignalType}`
//             runObaEventCallbacks({ blockID, context})
//         }

//         const vaultCTimeStampStr = vaultSignal?.['creator.timestamp']
//         console.log("resolveSignalEvents:vaultCTimeStampStr: ", vaultCTimeStampStr)
//         const pulledCTimeStampStr = pulledSignal?.['creator.timestamp']
//         console.log("resolveSignalEvents:pulledCTimeStampStr: ", pulledCTimeStampStr)
//         if (vaultCTimeStampStr && pulledCTimeStampStr) {
//             const pulledCTimeStamp = new Date(pulledCTimeStampStr)
//             console.log("resolveSignalEvents:pulledCTimeStamp: ", pulledCTimeStamp)
//             const vaultCTimeStamp = new Date(vaultCTimeStampStr)
//             console.log("resolveSignalEvents:vaultCTimeStamp: ", vaultCTimeStamp)

//             // callback
//             eventID = context["eventID"] = `obasync.signals.both.ctimetags.present`
//             blockID = `${eventID}:${pulledSignalType}`
//             runObaEventCallbacks({ blockID, context})

//             // callback
//             if (vaultCTimeStamp < pulledCTimeStamp) {
//                 // mine.newer
//                 eventID = context["eventID"] = `obasync.vault.signal.ctimetag.older`
//                 blockID = `${eventID}:${pulledSignalType}`
//                 runObaEventCallbacks({ blockID, context})
//                 eventID = context["eventID"] = `obasync.vault.signal.ctimetag.missing.or.older`
//                 blockID = `${eventID}:${pulledSignalType}`
//                 runObaEventCallbacks({ blockID, context})
//             }
//             // callback
//             if (vaultCTimeStamp == pulledCTimeStamp) {
//                 // both.equal
//                 eventID = context["eventID"] = `obasync.signals.both.ctimetags.equal`
//                 blockID = `${eventID}:${pulledSignalType}`
//                 runObaEventCallbacks({ blockID, context})
//             }
//             // callback
//             if (vaultCTimeStamp > pulledCTimeStamp) {
//                 // both.equal
//                 eventID = context["eventID"] = `obasync.vault.signal.ctimetag.newer`
//                 blockID = `${eventID}:${pulledSignalType}`
//                 runObaEventCallbacks({ blockID, context})
//                 eventID = context["eventID"] = `obasync.vault.signal.ctimetag.missing.or.newer`
//                 blockID = `${eventID}:${pulledSignalType}`
//                 runObaEventCallbacks({ blockID, context})
//             }
//         }

//         // callback
//         if (!vaultCTimeStampStr && pulledCTimeStampStr) {
//             eventID = context["eventID"] = `obasync.vault.signal.ctimetag.missing`
//             blockID = `${eventID}:${pulledSignalType}`
//             runObaEventCallbacks({ blockID, context})
//         }

//             // callback
//             if (vaultCTimeStampStr && !pulledCTimeStampStr) {
//                 eventID = context["eventID"] = `obasync.pulled.signal.ctimetag.missing`
//                 blockID = `${eventID}:${pulledSignalType}`
//                 runObaEventCallbacks({ blockID, context})
//             }

//         // callback
//         if (!vaultCTimeStampStr && !pulledCTimeStampStr) {
//             eventID = context["eventID"] = `obasync.signals.both.ctimetags.missing`
//             blockID = `${eventID}:${pulledSignalType}`
//             runObaEventCallbacks({ blockID, context})
//         }
//     } // for (const pulledSignalKey in man1Issued)

// }

// // MARK: resolveSignalEventsAllChannles
// export async function resolveSignalEventsAllChannles(
//     controlArgs: _resolveSignalControlArgs
// ) {
//     console.log("resolveSignalEventsAllChannles")
//     const channelsConfig = getObaConfig("obasync.channels", {})
//     const vaultUserName = getObaConfig("obasync.me", null)
//     const vaultDepot = getVaultDir()
//     for (const channelName in channelsConfig) {
//         console.log("==============================")
//         console.log("resolveSignalEventsAllChannles:channelName: ", channelName)
//         const channelConfig = channelsConfig?.[channelName] || {}
//         console.log("resolveSignalEventsAllChannles:channelConfig: ", channelConfig)
//         const pushDepot = channelConfig?.["push.depot"] || null
//         console.log("resolveSignalEventsAllChannles:pushDepot: ", pushDepot)
//         const pullDepots = channelConfig?.["pull.depots"] || []
//         console.log("resolveSignalEventsAllChannles:pullDepots: ", pullDepots)
//         for (const pullDepot of pullDepots) {
//             console.log("------------------------------")
//             console.log("resolveSignalEventsAllChannles:pullDepot: ", pullDepot)
//             // process
//             console.log("------------------------------")
//             console.log("resolveSignalEventsAllChannles:resolveSignalEvents")
//             await resolveSignalEvents({
//                 vaultDepot, pushDepot, pullDepot,
//                 manType: 'main', //TODO/ interfece with Oba.jsonc
//                 vaultUserName,
//                 channelName,
//                 ...controlArgs
//             })
//         }
//     }
// }

// // MARK: SignalHandlerArgs
// export interface SignalHandlerArgs {
//     context: ObaSyncCallbackContext, 
//     eventID: ObaSyncEventID, 
//     task: TaskState
// }

// // MARK: SignalHandlerType
// type SignalHandlerType = (arg: SignalHandlerArgs) => 
//     (HandlingStatus | Promise<HandlingStatus>)

// // MARK: registerSignalEventHandler
// async function _signalEventHandlerTaskFun(task: TaskState) {
    
//     // const context = task["args"]["context"] as ObaSyncCallbackContext
//     // const eventID = context["eventID"] =task["args"]["eventID"] as ObaSyncEventID
//     // const handler = task["args"]["handler"] as SignalHandlerType

//     // const status = await handler({context, eventID, task})

//     // if (status == "handler.ok") {

//     //     // extract
//     //     const vaultDepot = context0["vaultDepot"]
//     //     const pushDepot = context0["pushDepot"]
//     //     const manIder = context0["manIder"]
//     //     const pulledSignal = context0["pulledSignal"]
        
//     //     const signalTemplate: ObaSyncSignal = {
//     //         ...pulledSignal,
//     //         // add handler section
//     //         // 'handler.name'?: string
//     //         'handler.name': handlerName,
//     //         // 'handler.callback'?: string
//     //         "handler.callback": blockID,
//     //         // 'handler.timestamp'?: string,
//     //         "handler.timestamp": utcTimeTag(),
//     //         // 'handler.handlingStatus'?: HandlingStatus
//     //         'handler.handlingStatus': status,
//     //         // 'handler.channelName'?: string
//     //         'handler.channelName': manIder["channelName"],
//     //     }

//     //     // record signal in vault manifest
//     //     await publishSignal({
//     //         vaultDepot,
//     //         pushDepot,
//     //         committerName: handlerName,
//     //         manIder,
//     //         signalTemplate,
//     //         hashDig: [],
//     //         commitPushRepo: true,
//     //         commitVaultRepo: true,
//     //         pushPushRepo: true,
//     //         notify: true
//     //     })

//     //     // notice
//     //     const msg = [
//     //         `Signal processed succesfully`,
//     //         ` - type: ${signalTemplate["type"]}`,
//     //         ` - handler.name: ${signalTemplate["handler.name"]}`,
//     //         ` - handler.channelName: ${signalTemplate["handler.channelName"]}`,
//     //         ` - creator.hashKey: ${signalTemplate["creator.hashKey"]}`,
//     //         ` - creator.name: ${signalTemplate["creator.name"]}`,
//     //         ` - creator.channelName: ${signalTemplate["creator.channelName"]}`,
//     //         ` - creator.timestamp: ${signalTemplate["creator.timestamp"]}`,
//     //         ` - eventID: ${eventID}`,
//     //     ].join("\n")
//     //     new Notice(msg, 1 * 60 * 1000)
//     //     console.log(msg)
        
//     // }
//     // if (status == "unhandled") {
//     // }
//     // if (status == "unknown") {
//     //     console.warn(`Signal status 'error': ${eventID}:${signalType}`)
//     // }
//     // if (status == "error") {
//     //     console.error(`Signal status 'error': ${eventID}:${signalType}`)
//     // }
// }

// /*
//     Register a callback that will spawn a task for handling 
//     a signal event... 
// */ 
// export function registerSignalEventHandler({
//     handler,
//     handlerName,
//     eventID,
//     signalType, 
//     deltaGas = 1,
//     priority = 10,
//     taskIDDigFun = (() => [])
// }: {
//     handler: SignalHandlerType,
//     handlerName: string, 
//     eventID: ObaSyncEventID, 
//     signalType: string, 
//     deltaGas?: number,
//     priority?: number,
//     taskIDDigFun?: (context: ObaSyncCallbackContext) => string[]
// }) {
//     const blockID = `${eventID}:${signalType}`
    
//     registerObaEventCallback({
//         blockID, 
//         async callback(
//             task:ObaSchedulerTask, 
//             execBlock: ObaSchedulerExecutionBlock
//         ) {
//             const context = execBlock["context"]
//             const eventID0 = context["eventID"]
//             if (eventID != eventID0) {
//                 console.error(`Non-matching eventIDs, ${eventID} != ${eventID0}`)
//                 return;
//             }

//             const taskIDDig = taskIDDigFun(context as ObaSyncCallbackContext)
//             const taskID = hash64Chain(blockID, ...taskIDDig)

//             // ObaScheduler.spawn({
//             //     id: taskID, 
//             //     deltaGas, priority,
//             //     args: {...args, handler, handlerName},
//             //     taskFun: _signalEventHandlerTaskFun
//             // })
//             return;
//         }
//     })
// }
