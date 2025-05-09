import { _obasync_dev_commands } from "./dev-commands";
import { _gittools_devCommands } from "./gittools-commands";
import { _modifiedFileSignal_commands } from "./modifiedFileSignal-commands";
import { _modifiedFileSignal_events_callbacks } from "./modifiedFileSignal-ev-callbacks";
import { _obasync_signals_commands } from "./signals-commands";

/*
    /TODO/ add actions when clicking a notice
    /TODO/ publish in a manifest, the local state of repos...
    /TODO/ Make public (in pushRepo) log file for ObaSync stuff...
        - This can help improve troubleshooting...
*/ 

/*
    Main module to handle syncronization with other vaults
*/

export function onload() {
    console.log("ObaSync:onload");

    // setObaSyncFlag(`online.mode`, true)

    // Order matter?
    // _serviceCommands()
    // _serviceCallbacks()

    _modifiedFileSignal_events_callbacks();

    _obasync_dev_commands()
    _modifiedFileSignal_commands()
    _gittools_devCommands()
    _obasync_signals_commands()

}

export function onunload() {

    // if (INTERVAL1_ID) {
    //     window.clearInterval(INTERVAL1_ID);
    // }
}
