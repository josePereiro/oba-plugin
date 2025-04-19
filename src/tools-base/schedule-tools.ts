/*
    Ensure a given task to be called only is a previous one is finished
*/
import { runObaCallbacks } from "src/services-base/callbacks";
import { shuffledKeys } from "./utils-tools";

 

const SINGLETRON_REG: {[keys: string]: string} = {}

export async function dropRepeatedCall(
    id: string,
    call: (() => any),
    dflt: any = null
) {
    const status = SINGLETRON_REG?.[id] || null
    if (status == 'running') { 
        const callbackID = `${id}.running`;
        await runObaCallbacks(callbackID)
        return dflt; 
    }
    try {
        SINGLETRON_REG[id] = 'running'
        await call()
    } finally {
        SINGLETRON_REG[id] = 'idle'
        const callbackID = `${id}.finally`;
        await runObaCallbacks(callbackID)
    }
}

export interface TaskState {
    "taskFun": ((t:TaskState) => any),
    "args": any,
    "gas": number
}

export class SequentialAsyncScheduler {

    constructor(
        private tasksStack: {[keys: string]: TaskState} = {},
        private running = false
    ) {}

    public spawn({
        id, 
        taskFun,
        args = {},
        deltaGas = 1,
    }: {
        id: string,
        taskFun: ((t:TaskState) => any),
        args?: any,
        deltaGas?: number
    }) {
        this.tasksStack[id] = {
            "taskFun": taskFun, 
            "args": args,
            "gas": this.tasksStack?.[id]?.["gas"] || 0
        }
        this.addGas(id, deltaGas)
        return this
    }

    public addGas(
        id: string, 
        deltaGas: number = 1
    ) {
        const task = this.tasksStack?.[id]
        if (!task) { return this; }
        task["gas"] = task["gas"] + deltaGas 
        return this
    }

    public async run(wt = 500) {
        if (this.running) { return this; }
        this.running = true
        while (this.running) {
            let idle = true
            const taskIds = shuffledKeys(this.tasksStack)
            for (const taskId of taskIds) {
                console.log("taskId:", taskId)
                const task = this.tasksStack[taskId]
                if (task["gas"] < 1) { continue; }
                idle = false
                task["gas"] = task["gas"] - 1
                await task["taskFun"](task)
            }
            if (idle) { await sleep(wt); }
        }
        return this
    }

    public stop() {
        this.running = false;
        return this
    }
}