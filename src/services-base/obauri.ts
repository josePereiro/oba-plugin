/*
    An interface for handling
    open "obsidian://oba-uri?_vault=MetXVault?_line=1"
*/
import { OBA } from "src/oba-base/globals";
import { runObaEventCallbacks } from "src/scheduler-base/event-callbacks";

const OBAURI_ACTION_NAME = "oba-uri";

export function onload() {
    console.log("ObaUri:onload");

    OBA.registerObsidianProtocolHandler(OBAURI_ACTION_NAME, async (args) => {
        runObaEventCallbacks({ 
            blockID: `callbacks.obauri.action`, 
            context: { args }
        })
    });
}