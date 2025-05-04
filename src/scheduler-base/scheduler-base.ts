/*
    Oba Scheduler
    - Must 'complex' tasks must be executed by this
    - there are to execution actions
        - run: It will run the bundles tasks inmidiatly
        - spawn: The task will be placed on a execution list
*/ 

export const MIN_PRIORITY = 1; // importat avoid falsy bugs
export const DEFT_PRIORITY = 3;
export const MAX_PRIORITY = 5;

export interface ObaSchedulerTask {
    callback: ObaSchedulerTaskFun,
    taskPriority: number
}

// Register here all blockID
export type ObaSchedulerExecContext = {[keys: string]: any}


export type ObaSchedulerTaskFunReturn = 
    'abort' | void | Promise<'abort' | void>

export type ObaSchedulerTaskFunArgs = {
    task:ObaSchedulerTask, 
    execBlock: ObaSchedulerExecutionBlock
}
export type ObaSchedulerTaskFun = 
    (arg: ObaSchedulerTaskFunArgs) => 
        ObaSchedulerTaskFunReturn


export type ObaSchedulerExecBlockType = 
    | 'manual.exec.block' 
    | 'auto.sequencial.exec.block'

export interface ObaSchedulerExecutionBlock {
    blockID: string,
    blockType: ObaSchedulerExecBlockType,
    blockPriority: number,
    context: ObaSchedulerExecContext,
    tasks: Array<ObaSchedulerTask>, 
    blockGas: number
}

// TODO/ lock writing to this object
export const OBA_SCHEDULER_REGISTRY: {[keys: string]: ObaSchedulerExecutionBlock} = {}

// MARK: _execBlockTasks
/*
    Tasks are executed in priority order and only once
*/ 
export async function _execBlockTasks(
    execBlock: ObaSchedulerExecutionBlock
) {
    const tasks = execBlock["tasks"]
    let idle = true
    for (
        let priority0 = MIN_PRIORITY;
        priority0 <= MAX_PRIORITY;
        priority0++
    ) {
        for (const task of tasks) {
            const priority1 = task?.["taskPriority"] ?? DEFT_PRIORITY
            if (priority1 != priority0) { continue; }
            try {
                const callback = task["callback"]
                const flag = await callback({task, execBlock})
                idle = false
                if (flag == 'abort') { break; }
            } catch (err) {
                console.error(
                    "Error executing block:\nerr: ", err, 
                    "\nexecBlock: ", execBlock
                )
            }
        }
    }
    return idle
    
}

export type ObaSchedulerTaskRegMode = 'push' | 'first' | 'last'

// MARK: _registerObaTask
export function _registerObaTask({
    blockID,
    blockType,
    context,
    blockPriority,
    blockGas,
    task,
    regMode
}:{
    blockID: string,
    blockType: ObaSchedulerExecBlockType | null,
    context: ObaSchedulerExecContext | null,
    blockPriority: number | null,
    blockGas: number | null,
    task: ObaSchedulerTask,
    regMode: ObaSchedulerTaskRegMode
}){

    // setup block
    let block = OBA_SCHEDULER_REGISTRY?.[blockID] || {} as ObaSchedulerExecutionBlock
    if (context) {
        block["context"] = context
    }
    if (blockType) {
        block["blockType"] = blockType
    }
    if (blockPriority) {
        block["blockPriority"] = blockPriority
    }
    if (blockGas) {
        block["blockGas"] = blockGas
    }
    console.log("_registerObaTask:block: ", block)
    OBA_SCHEDULER_REGISTRY[blockID] = block

    // format task
    console.log("_registerObaTask:task ", task)
    const taskPriority = task?.["taskPriority"] ?? DEFT_PRIORITY
    console.log("_registerObaTask:taskPriority ", taskPriority)
    task["taskPriority"] = Math.clamp(taskPriority, MIN_PRIORITY, MAX_PRIORITY)
    console.log("_registerObaTask:task.taskPriority ", task["taskPriority"])

    // handle task
    const tasks = block["tasks"] = block?.["tasks"] || []
    if (regMode == "push" || tasks.length == 0) {
        tasks.push(task)
    } else if (regMode == "first") {
        tasks[0] = task
    } else if (regMode == "last") {
        tasks[tasks.length-1] = task
    }
}
