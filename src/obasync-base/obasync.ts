import { _gittools_devCommands } from "./dev-commands";

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

    _gittools_devCommands()

}

export function onunload() {

    // if (INTERVAL1_ID) {
    //     window.clearInterval(INTERVAL1_ID);
    // }
}
