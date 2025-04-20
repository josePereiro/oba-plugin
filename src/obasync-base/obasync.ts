import { _serviceCommands } from "./commands-base";
import { _serviceCallbacks } from "./callbacks-base";
import { SequentialAsyncScheduler, TaskState } from "src/tools-base/schedule-tools";

/*
    Main module to handle syncronization with other vaults
*/

export let ObaSyncScheduler: SequentialAsyncScheduler;

export function onload() {
    console.log("ObaSync:onload");
    _serviceCommands()
    _serviceCallbacks()
    ObaSyncScheduler = new SequentialAsyncScheduler()
    ObaSyncScheduler.run()

}

export function onunload() {
    ObaSyncScheduler.stop()
}
