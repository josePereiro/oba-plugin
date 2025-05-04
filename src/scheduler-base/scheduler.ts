import { addObaCommand } from "src/oba-base/commands";
import { randstring } from "src/tools-base/utils-tools";
import { registerObaEventCallback, runObaEventCallbacks } from "./event-callbacks";
import { MAX_PRIORITY, MIN_PRIORITY, OBA_SCHEDULER_REGISTRY, ObaSchedulerTaskFunArgs } from "./scheduler-base";
import { spawnObaSeqCallback, startObaSeqCallbackLoop, stopObaSeqCallbackLoop } from "./seq-callbacks";

/*
    DOING: Move spawn to the new scheduling
*/ 
export function onload() {
    console.log("ObaScheduler:onload")

    startObaSeqCallbackLoop()


    
    addObaCommand({
        commandName: 'stopObaSeqCallbackLoop',
        serviceName: ["ObaScheduler", "Dev"],
        commandCallback({ commandID, commandFullName }) {
            stopObaSeqCallbackLoop();
        }
    })
    
    // spawnObaSeqCallback(
    addObaCommand({
        commandName: 'run on.spawnObaSeqCallback.test',
        serviceName: ["ObaScheduler", "Dev"],
        commandCallback({ commandID, commandFullName }) {
            console.clear()
            type CommonsType = Array<{
                blockPriority: number,
                token: string,
            }>
            const outter_commons: CommonsType = []

            for (
                let blockPriority = MIN_PRIORITY;
                blockPriority <= MAX_PRIORITY;
                blockPriority++
            ) {
                const token = `${blockPriority}:${randstring()}`
                outter_commons.push({blockPriority, token})
                spawnObaSeqCallback({
                    blockID: `spawnObaSeqCallback.test:${blockPriority}`, 
                    blockPriority,
                    blockGas: 1,
                    context: { 
                        token, 
                        commons: outter_commons,
                    },
                    callback: async (arg: ObaSchedulerTaskFunArgs) => {
                        console.log(">>>>>>>>>>")
                        const task = arg["task"]
                        const block = arg["execBlock"]
                        const context = block["context"]
                        const blockPriority0 = block["blockPriority"]

                        // info before
                        console.log("context0: ", context)
                        const inner_commons: CommonsType = context?.["commons"] || []
                        
                        // check unique context
                        for (const common of inner_commons) {
                            const blockPriority1 = common["blockPriority"]
                            if (blockPriority0 == blockPriority1) {
                                if (common["token"] == context["token"]) {
                                    console.log("PASSED")
                                }
                                if (common["token"] != context["token"]) {
                                    console.error("FAILED: Unespected token")
                                }
                            }
                            if (blockPriority0 != blockPriority1) {
                                if (common["token"] != context["token"]) {
                                    console.log("PASSED")
                                }
                                if (common["token"] == context["token"]) {
                                    console.error("FAILED: Unespected token")
                                }
                            }
                        }

                        // wait
                        await sleep(500);

                        // info ofter
                        console.log("task: ", task)
                        console.log("execBlock: ", block)
                        console.log("context1: ", context)
                    }
                })
            }   
        },
    })

    for (
            let taskPriority = MIN_PRIORITY;
            taskPriority <= MAX_PRIORITY;
            taskPriority++
        ) {
        console.log("taskPriority: ", taskPriority)
        registerObaEventCallback({
            blockID: `on.registerObaEventCallback.test`,
            taskPriority,
            callback: async (arg: ObaSchedulerTaskFunArgs) => {
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