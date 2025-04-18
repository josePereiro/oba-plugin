import { _serviceCommands } from "./commands-base";
import { _serviceCallbacks } from "./callbacks-base";

/*
    Main module to handle syncronization with other vaults
*/

export function onload() {
    console.log("ObaSync:onload");
    _serviceCommands()
    _serviceCallbacks()
}
