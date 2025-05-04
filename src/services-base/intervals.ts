import { runObaEventCallbacks } from "src/scheduler-base/event-callbacks";

let INTERVAL_ID: number | null = null;

export function onload() {
    console.log("Intervals:onload");
    // startBackgroundTask()
}

export async function onunload() {
    console.log('Intervals:onunload');
    
    // Clean up the interval when plugin unloads
    if (INTERVAL_ID !== null) {
        window.clearInterval(this.intervalId);
        INTERVAL_ID = null;
    }
}

function startBackgroundTask() {
    // Clear any existing interval to prevent duplicates
    if (INTERVAL_ID !== null) {
        window.clearInterval(INTERVAL_ID);
    }

    // const interval = obaconfig.getObaConfig("interval1.period", 3000);
    const interval = 3000;
    INTERVAL_ID = window.setInterval(() => {
        runObaEventCallbacks({ 
            blockID: "oba-interval-1", 
            context: { interval }
        })
    }, interval);
}