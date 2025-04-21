import { _serviceCommands } from "./commands-base";
import { _serviceCallbacks, INTERVAL1_ID } from "./callbacks-base";
import { SequentialAsyncScheduler, TaskState } from "src/tools-base/schedule-tools";

/*
    Main module to handle syncronization with other vaults
*/

export let ObaSyncScheduler: SequentialAsyncScheduler;

export function onload() {
    console.log("ObaSync:onload");
    // DEV
    _serviceCommands()
    _serviceCallbacks()
    ObaSyncScheduler = new SequentialAsyncScheduler()
    ObaSyncScheduler.run()

}

export function onunload() {
    ObaSyncScheduler.stop()

    if (INTERVAL1_ID) {
        window.clearInterval(INTERVAL1_ID);
    }
}
