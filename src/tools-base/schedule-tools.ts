// MARK: ScheduleTools
/*
    Ensure a given task to be called only is a previous one is finished
*/


export interface TaskState {
    "taskFun": ((t:TaskState) => any),
    "args": {[keys: string]: any},
    "gas": number,
    "priority": number
}

export class SequentialAsyncScheduler {
    private MIN_PRIORITY = 0;
    private MAX_PRIORITY = 20;
    private DFLT_PRIORITY = 10;
    private idle: boolean = false;
    private running: boolean = false;
    private wt = 100 // ms
    private tasksStack: {[keys: string]: TaskState} = {}

    constructor() {}

    public spawn({
        id, 
        taskFun,
        args = {},
        deltaGas = 1,
        priority = this.DFLT_PRIORITY
    }: {
        id: string,
        taskFun: ((t:TaskState) => any),
        args?: any,
        deltaGas?: number,
        priority?: number
    }) {
        // new task
        this.tasksStack[id] = {
            taskFun, args,
            gas: this.tasksStack?.[id]?.["gas"] || 0, 
            priority: this.tasksStack?.[id]?.["priority"] || this.DFLT_PRIORITY, 
        }
        this.addGas(id, deltaGas)
        this.setPriority(id, priority)
        this.idle = false;
        this.run()
        return this
    }

    private addGas(
        id: string, 
        deltaGas: number = 1
    ) {
        const task = this.tasksStack?.[id]
        if (!task) { return this; }
        task["gas"] = task["gas"] + deltaGas 
        return this
    }

    private setPriority(
        id: string, 
        priority: number = this.DFLT_PRIORITY
    ) {
        priority = Math.clamp(priority, 
            this.MIN_PRIORITY, this.MAX_PRIORITY
        )
        const task = this.tasksStack?.[id]
        if (!task) { return this; }
        task["priority"] = priority
        return this
    }

    private unregister(
        id: string
    ) {
        if (this.tasksStack.hasOwnProperty(id)) {
            delete this.tasksStack[id]
        }
    }   

    public async run() {
        if (this.running) { return this; }
        this.running = true
        while (this.running) {
            this.idle = true  
            for (
                let priority0 = this.MIN_PRIORITY; 
                priority0 < this.MAX_PRIORITY; 
                priority0++
            ) {
                for (const taskId in this.tasksStack) {
                    // console.log("taskId:", taskId)
                    const task = this.tasksStack[taskId]
                    const priority = task?.["priority"] || this.DFLT_PRIORITY
                    if (priority > priority0) { continue; }
                    const gas = task["gas"]
                    if (gas < 1) { this.unregister(taskId) }
                    this.addGas(taskId, -1)

                    await task["taskFun"](task)
                    this.idle = false 
                }
            }
            // TODO/ implement increasing wt if idle presist
            while (this.idle) {
                await sleep(this.wt);
                // break to avoid deadends
                if (Math.random() > 0.9) { break; }
            }
        }
        return this
    }

    public stop() {
        this.idle = false;
        this.running = false;
        return this
    }
}


// MARK: TriggerManager
/**
* The TriggerManager class provides a mechanism to control trigger executions based on time intervals.
*
* Main features include:
* - Managing trigger invocations with configurable delay thresholds:
*   - ignoreTime: The minimal period that must elapse before another trigger can proceed.
*   - delayTime: The maximum allowable period during which the manager waits for a trigger to be activated.
*   - sleepTime: The interval to sleep between consecutive checks when waiting.
*
* - Tracking internal state:
*   - elapsed: The time elapsed since the last trigger action.
*   - lastAction: The timestamp of the last trigger execution.
*   - callCount: A counter indicating how many times the trigger management has been invoked.
*
* - Providing a flexible asynchronous management method (manage) that supports custom callbacks:
*   - prewait: Executed before entering the waiting period.
*   - onwait: Called during each wait period iteration.
*   - onnotyet: Executed when a trigger is attempted before the ignoreTime threshold is met.
*   - ongo: Called when the conditions for triggering an action have been satisfied.
*   - onelapsed: Invoked each time the elapsed time is updated.
*   - oncallcount: Executed whenever the call count is incremented.
*
* The manage method uses these callbacks and timing mechanisms to enable either fixed interval triggers
* (acting on a strict time schedule) or rolling triggers (delaying action until a specified period after the last activity).
*
* This class is useful for scenarios where it is necessary to debounce or throttle actions, ensuring that operations are not executed too frequently.
*/

/*
    TODO/ 
    - Make a fixed interval trigger and a rolling interval trigger
        - The fixed one is triggered every time a given time passed
        - The rolling one (the actual) is trigger x seconds after the last call
        - This can basically be implemented by the user from a callback
            so the internals of the manager are provided
*/ 

export interface TriggerManagerOptions {
    ignoreTime?: number;
    sleepTime?: number;
    delayTime?: number;
    elapsed?: number;
    lastAction?: number;
    callCount?: number;
}


export class TriggerManager {
    public ignoreTime = 3000;
    public sleepTime = 500;
    public delayTime = 3000;
    public elapsed = -1;
    public lastAction = -1;
    public callCount = 0;

    constructor(options: TriggerManagerOptions = {}) {
        Object.assign(this, options);
    }

    public async manage({
        ignoreTime,
        sleepTime,
        delayTime,
        prewait = () => null, 
        onwait = () => null, 
        onnotyet = () => null, 
        ongo = () => null,
        onelapsed = () => null,
        oncallcount = () => null,
    }: {
        ignoreTime?: number,
        sleepTime?: number,
        delayTime?: number,
        prewait?: () => any,
        onwait?: () => any,
        onnotyet?: () => any,
        ongo?: () => any,
        onelapsed?: () => any,    // on elapsed update
        oncallcount?: () => any,  // on callCount update
    } = {}) {

        // overwrite
        if(ignoreTime) { this.ignoreTime = ignoreTime; }
        if(sleepTime) { this.sleepTime = sleepTime; }
        if(delayTime) { this.delayTime = delayTime; }

        // manage
        let ret;
        this.callCount += 1;
        if ((ret = await oncallcount())) return ret;
        const now = new Date().getTime();
        this.elapsed = now - this.lastAction;
        if ((ret = await onelapsed())) return ret;

        this.lastAction = now;
        if (this.elapsed < this.ignoreTime) {
            if ((ret = await onnotyet())) return ret;
            return 'ignored';
        }
        // rolling wait
        if ((ret = await prewait())) return ret;
        while (true) {
            const now = new Date().getTime();
            this.elapsed = now - this.lastAction;
            if ((ret = await onelapsed())) return ret;
            if (this.delayTime < 0) { break; }
            if (this.elapsed > this.delayTime) { break; }
            if ((ret = await onwait())) return ret;
            await sleep(this.sleepTime);
        }
        if ((ret = await ongo())) return ret;
        return 'go';
    }

}
