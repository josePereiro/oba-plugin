import { exec, spawn } from "child_process";
import { Notice } from "obsidian";
import * as path from "path";
import { dirname } from "path";
import { buildObaDirPath } from "src/oba-base/filesys";
import { OBA } from "src/oba-base/globals";

/*
    Listen a signal and trigger an Oba update
    /TODO make it work...
    - Now, user must do it manually. 


    /DESIGN/
    - A signal will be located on the vault so it triggers an update
    - An update can be also triggered by a command
    - It will rely on `Hot Reload` plugin
*/ 

export function onload() {
    console.log("ObaUp:onload");

    // node install-plugin.js ~/Documents/Obsidian/MetXVault
}

// export function obaUpSignalFile(
//     vault: string              // target vault
// ) {
//     const obaDir = buildObaDirPath(vault)
// }

// export function upObaPlugin(
//     vault: string,              // target vault
// ) {

// }