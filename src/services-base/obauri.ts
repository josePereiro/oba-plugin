/*
    An interface for handling
    open "obsidian://oba-uri?_vault=MetXVault?_line=1"
*/
import { OBA } from "src/oba-base/globals";
import { callbacks } from "./0-servises-modules";

const OBAURI_ACTION_NAME = "oba-uri";

export function onload() {
    console.log("ObaUri:onload");

    OBA.registerObsidianProtocolHandler(OBAURI_ACTION_NAME, async (params) => {
        callbacks.runCallbacks(`callbacks.obauri.action`, params);
    });
}