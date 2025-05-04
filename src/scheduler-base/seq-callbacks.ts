import { getState, setState } from "src/oba-base/state"
import { DEFT_PRIORITY, MAX_PRIORITY, MIN_PRIORITY, OBA_SCHEDULER_REGISTRY, ObaSchedulerExecContext, ObaSchedulerTaskFun, ObaSchedulerTaskRegMode, _execBlockTasks, _registerObaTask } from "./scheduler-base"

// MARK: State
export const ObaSeqCallbackState: {
    running: boolean,
    idle: boolean,
    wt_ms: number
} = {
    running: false,
    idle: true,
    wt_ms: 100
}


// MARK: ObaSeqCallbacks
export async function spawnObaSeqCallback({
    blockID,
    context,
    callback,
    blockPriority, 
    blockGas, 
    taskPriority = DEFT_PRIORITY,
    regMode = 'first'
}:{
    blockID: string,
    callback: ObaSchedulerTaskFun,
    taskPriority?: number,
    context: ObaSchedulerExecContext | null,
    blockPriority?: number | null,
    blockGas?: number | null,
    regMode?: ObaSchedulerTaskRegMode
}) {
    ObaSeqCallbackState["running"] = true
    ObaSeqCallbackState["idle"] = false
    _registerObaTask({
        blockID,
        blockType: 'auto.sequencial.exec.block',
        context,
        blockPriority,
        blockGas,
        task: { callback, taskPriority },
        regMode
    })
}

export async function _onePassObaSeqCallbackLoop() {
    let idle0 = true
    for (
        let priority0 = MIN_PRIORITY;
        priority0 <= MAX_PRIORITY;
        priority0++
    ) {
        for (const blockID in OBA_SCHEDULER_REGISTRY) {
            const block = OBA_SCHEDULER_REGISTRY[blockID]
            if (block["blockType"] != "auto.sequencial.exec.block") { continue; }
            console.log("_onePassObaSeqCallbackLoop:blockID", blockID)
            if (block["blockGas"] < 1) { delete OBA_SCHEDULER_REGISTRY[blockID]; continue }
            const priority1 = block["blockPriority"]
            if (priority1 > priority0) { continue; }
            block["blockGas"] = block["blockGas"] - 1
            const idle1 = await _execBlockTasks(block)
            if (!idle1) { idle0 = false; }
            if (block["blockGas"] < 1) { delete OBA_SCHEDULER_REGISTRY[blockID] }
        }
    }
    return idle0
}

export async function startObaSeqCallbackLoop() {
    ObaSeqCallbackState["running"] = true
    while(ObaSeqCallbackState["running"]) {
        // run
        ObaSeqCallbackState["idle"] = true
        const idlePass = await _onePassObaSeqCallbackLoop()
        if (!idlePass) { ObaSeqCallbackState["idle"] = false }
        
        // wait if idle
        let counter = 0
        const counterMax = 10 * 1000 / ObaSeqCallbackState["wt_ms"] // approx 10 secs
        while (ObaSeqCallbackState["idle"]) {
            // wait for external signal
            await sleep(ObaSeqCallbackState["wt_ms"]);
            // break to avoid deadlock
            if (counter > counterMax) { break; }
            counter++;
        }
    }
}

// NOTE: This must be run at plugin onunload
export async function stopObaSeqCallbackLoop() {
    ObaSeqCallbackState["running"] = false
    ObaSeqCallbackState["idle"] = true
}
