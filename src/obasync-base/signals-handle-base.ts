import { Notice } from "obsidian"
import { registerObaEventCallback } from "src/scheduler-base/event-callbacks"
import { ObaSchedulerExecContext, ObaSchedulerExecutionBlock, ObaSchedulerTask } from "src/scheduler-base/scheduler-base"
import { TaskState } from "src/tools-base/schedule-tools"
import { hash64Chain } from "src/tools-base/utils-tools"
import { HandlingStatus, ObaSyncEventCallbackContext, ObaSyncSignal } from "./signals-base"
import { publishSignal } from "./signals-publish-base"
import { ObaSyncEventID } from "./signals-resolve-base"
import { utcTimeTag } from "./utils-base"
import { spawnObaSeqCallback } from "src/scheduler-base/seq-callbacks"



// MARK: SignalHandlerArgs
export interface SignalHandlerArgs {
    context: ObaSyncEventCallbackContext, 
    eventID: ObaSyncEventID, 
    execBlock: ObaSchedulerExecutionBlock
}

// MARK: SignalHandlerType
type SignalHandlerType = (arg: SignalHandlerArgs) => 
    (HandlingStatus | Promise<HandlingStatus>)

// MARK: registerSignalEventHandler
/*
    Register a callback that will spawn a task for handling 
    a signal event... ;)
*/ 
export function registerSignalEventHandler({
    handler,
    handlerName,
    eventID,
    signalType, 
    blockGas = 1,
    blockPriority = 1,
    taskIDDigFun = (() => [])
}: {
    handler: SignalHandlerType,
    handlerName: string, 
    eventID: ObaSyncEventID, 
    signalType: string, 
    blockGas?: number,
    blockPriority?: number,
    taskIDDigFun?: (context: ObaSyncEventCallbackContext) => string[]
}) {
    const callBlockID = `${eventID}:${signalType}`
    
    registerObaEventCallback({
        blockID: callBlockID, 
        async callback(
            args
        : {
            task:ObaSchedulerTask, 
            execBlock: ObaSchedulerExecutionBlock
        }) {

            const {task, execBlock} = args

            const callContext = execBlock["context"] as ObaSyncEventCallbackContext
            const eventID0 = callContext["eventID"] as ObaSyncEventID
            if (eventID != eventID0) {
                console.error(`Non-matching eventIDs, ${eventID} != ${eventID0}`)
                return;
            }

            // TODO/ rename better callback stuf from seq callback stuff
            const taskIDDig = taskIDDigFun(callContext)
            const spawnBlockID = hash64Chain(callBlockID, ...taskIDDig)
            const spawnContext = {
                handlerName, 
                signalType,
                handler,
                ...callContext
            }
            spawnObaSeqCallback({
                blockID: spawnBlockID,
                callback: _signalEventHandlerTaskFun,
                context: spawnContext,
                blockPriority,
                blockGas
            })
            return;
        }
    })
}



// MARK: _registerSignalEventHandler
async function _signalEventHandlerTaskFun(
    args
: {
    task:ObaSchedulerTask, 
    execBlock: ObaSchedulerExecutionBlock
}) {
    const {task, execBlock} = args

    const blockContext = execBlock["context"] as ObaSchedulerExecContext
    const blockID = execBlock["blockID"]
    const eventID = blockContext["eventID"] as ObaSyncEventID
    const handler = blockContext["handler"] as SignalHandlerType
    const handlerName = blockContext["handlerName"]
    const signalType = blockContext["signalType"]

    const callContext = blockContext as ObaSyncEventCallbackContext
    const status = await handler({
        eventID, 
        context: callContext, 
        execBlock
    })

    if (status == "handler.ok") {

        // extract
        const vaultDepot = callContext["vaultDepot"]
        const pushRepoOps = callContext["pushRepoOps"]
        const manIder = callContext["manIder"]
        const pulledSignal = callContext["pulledSignal"]
        
        const signalTemplate: ObaSyncSignal = {
            ...pulledSignal,
            // add handler section
            // 'handler.name'?: string
            'handler.name': handlerName,
            // 'handler.callback'?: string
            "handler.callback": blockID,
            // 'handler.timestamp'?: string,
            "handler.timestamp": utcTimeTag(),
            // 'handler.handlingStatus'?: HandlingStatus
            'handler.handlingStatus': status,
            // 'handler.channelName'?: string
            'handler.channelName': manIder["channelName"],
        }

        // also publish signal in my vault mannifest
        // - See that the signal has a lot of the same metadata
        // as the one recieved
        await publishSignal({
            committerName: handlerName,
            manIder, vaultDepot,
            notifyEnable: true,
            hashDig: [],
            signalTemplate,
            gitSyncUpArgs: {
                repoOps: pushRepoOps,
                addEnable: true,
                commitEnable: true, 
                commitMsg: `signalEventHandler - ${utcTimeTag()}`,
                dummyText: '123',
                cloneEnable: false,
                pushEnable: false, 
                cloneForce: false,
                rmRepoEnable: false,
                touchEnable: false,
                mkRepoDirEnable: false,
                timeoutMs: 10 * 1000,
                rollTimeOut: true,
            }
        })

        // notice
        const msg = [
            `Signal processed succesfully`,
            ` - type: ${signalTemplate["type"]}`,
            ` - handler.name: ${signalTemplate["handler.name"]}`,
            ` - handler.channelName: ${signalTemplate["handler.channelName"]}`,
            ` - creator.hashKey: ${signalTemplate["creator.hashKey"]}`,
            ` - creator.name: ${signalTemplate["creator.name"]}`,
            ` - creator.channelName: ${signalTemplate["creator.channelName"]}`,
            ` - creator.timestamp: ${signalTemplate["creator.timestamp"]}`,
            ` - eventID: ${eventID}`,
        ].join("\n")
        new Notice(msg, 1 * 60 * 1000)
        console.log(msg)
        
    }
    if (status == "unhandled") {
    }
    if (status == "unknown") {
        console.warn(`Signal status 'error': ${eventID}:${signalType}`)
    }
    if (status == "error") {
        console.error(`Signal status 'error': ${eventID}:${signalType}`)
    }
}
