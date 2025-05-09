import { TagLogger } from "src/tools-base/dev-tools"
import { _execBlockTasks, _registerObaTask, DEFT_PRIORITY, OBA_SCHEDULER_REGISTRY, ObaSchedulerExecContext, ObaSchedulerTaskFun } from "./scheduler-base"

// MARK: ObaCallback
/*
TODO/ recover as much as possible previous callback interface
*/ 

// MARK: registerObaEventCallback
export function registerObaEventCallback({
    blockID,
    callback,
    taskPriority = DEFT_PRIORITY
}:{
    blockID: string,
    callback: ObaSchedulerTaskFun,
    taskPriority?: number
}) {
    _registerObaTask({
        blockID,
        blockType: 'manual.exec.block',
        context: {},
        blockPriority: -1,  // irrelevant
        blockGas: -1,       // irrelevant
        task: { callback, taskPriority },
        regMode: 'push'
    })
}

// MARK: runObaEventCallbacks
export async function runObaEventCallbacks({
    blockID,
    context
}:{
    blockID: string,
    context: ObaSchedulerExecContext | null,
}){
    const taglogger = new TagLogger(["Scheduler", "runObaEventCallbacks"])

    const block = OBA_SCHEDULER_REGISTRY?.[blockID] || null
    if (!block) {
        taglogger.warn("missing block", {blockID, context})
        return; 
    }
    if (context) { block["context"] = context }
    return await _execBlockTasks(block)
}