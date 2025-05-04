import { addObaCommand } from "src/oba-base/commands";
import { registerObaEventCallback, runObaEventCallbacks } from "./event-callbacks";
import { MAX_PRIORITY, MIN_PRIORITY, OBA_SCHEDULER_REGISTRY, ObaSchedulerTaskFunArg } from "./scheduler-base";
import { startObaSeqCallbackLoop, stopObaSeqCallbackLoop } from "./seq-callbacks";

export function onload() {
    console.log("ObaScheduler:onload")

    startObaSeqCallbackLoop()

    // MARK: register callbacks
    for (
            let taskPriority = MIN_PRIORITY;
            taskPriority <= MAX_PRIORITY;
            taskPriority++
        ) {
        console.log("taskPriority: ", taskPriority)
        registerObaEventCallback({
            blockID: `on.registerObaEventCallback.test`,
            taskPriority,
            callback: async (arg: ObaSchedulerTaskFunArg) => {
                console.log("------------")
                const task = arg["task"]
                const block = arg["execBlock"]
                const context = block["context"]

                // info before
                console.log("context0: ", context)

                // ignore first
                if (task["taskPriority"] != MIN_PRIORITY) {
                    // check order
                    const expectedLast = task["taskPriority"] - 1
                    const recordedLast = context?.["last.taskPriority"]
                    if (recordedLast != expectedLast) {
                        console.error("Boooo, unespected last.taskPriority")
                    }
                }

                // feedback
                context["last.taskPriority"] = task["taskPriority"]

                // wait
                await sleep(500);

                // info ofter
                console.log("task: ", task)
                console.log("execBlock: ", block)
                console.log("context1: ", context)
            }
        })
    }

    addObaCommand({
        commandName: 'run on.registerObaEventCallback.test',
        serviceName: ["ObaScheduler", "Dev"],
        commandCallback({ commandID, commandFullName }) {
            console.clear()
            runObaEventCallbacks({
                blockID: `on.registerObaEventCallback.test`,
                context: { 
                    "msg": "This is a test"
                },
            })
        },
    })

    addObaCommand({
        commandName: 'log OBA_SCHEDULER_REGISTRY',
        serviceName: ["ObaScheduler", "Dev"],
        commandCallback({ commandID, commandFullName }) {
            console.clear()
            console.log(OBA_SCHEDULER_REGISTRY)
        },
    })

    
}

export function onunload() {
    console.log("ObaScheduler:onload")
    stopObaSeqCallbackLoop()
}