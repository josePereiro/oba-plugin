import { registerObaEventCallback } from "./event-callbacks";
import { MAX_PRIORITY, MIN_PRIORITY, ObaSchedulerExecutionBlock, ObaSchedulerTask } from "./scheduler-base";
import { startObaSeqCallbackLoop, stopObaSeqCallbackLoop } from "./seq-callbacks";

export function onload() {
    console.log("ObaScheduler:onload")

    startObaSeqCallbackLoop()

    for (
            let taskPriority = MIN_PRIORITY;
            taskPriority <= MAX_PRIORITY;
            taskPriority++
        ) {
        registerObaEventCallback({
            blockID: `registerObaEventCallback.test:${taskPriority}`,
            callback(
                task: ObaSchedulerTask, execBlock: ObaSchedulerExecutionBlock
            ) {
                console.log("task: ", taskPriority)
            },
        })
    }
}

export function onunload() {
    console.log("ObaScheduler:onload")
    stopObaSeqCallbackLoop()
}