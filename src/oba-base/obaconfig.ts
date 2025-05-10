import { statSync } from "fs";
import { join } from "path";
import { vscodeGotoFile } from "src/services-base/vscode";
import { tools } from "src/tools-base/0-tools-modules";
import { JsonIO } from "src/tools-base/jsonio-base";
import { getVaultDir } from "src/tools-base/obsidian-tools";
import { addObaCommand } from "./commands";

/*
    Handle Oba confg file
*/

export let CONFIG: JsonIO = new JsonIO();

export function onload() {
    console.log("obaconfig:onload");
    
    // first load
    loadObaConfigOnDemand()

    addObaCommand({
        commandName: "open Oba.jsonc",
        serviceName: ["ObaConfig"],
        async commandCallback({ commandID, commandFullName }) {
            console.clear()
            const path = getObaConfigPath()
            vscodeGotoFile(path)
        },
    })

    addObaCommand({
        commandName: "log Oba.jsonc",
        serviceName: ["ObaConfig", "Dev"],
        async commandCallback({ commandID, commandFullName }) {
            console.clear()
            loadObaConfigOnDemand()
            console.log({config: CONFIG.retDepot()})
        },
    })
}

export function loadObaConfigOnDemand() : boolean {
    try {
        
        // Check file
        const configPath = getObaConfigPath()
        const ev = tools.compareMtimeMsCached(configPath, 'loadObaConfigOnDemand')
        if (ev["file.intact"]) { return false }

        // load
        const io = new JsonIO()
        io.file(configPath).loadd({} as {[key: string]: any})
        // const json = tools.loadJsonFileSync(configPath)
        // if (!json) { return false; }
        CONFIG = io; // update
        console.log("config loaded!");
        console.log(io.retDepot());

    } catch (err) {
        console.error("Error loading config", err);
        return false
    }
    return true
}   

// read a key in the config file
export function getObaConfig(key: string, dflt: any = null) {
    loadObaConfigOnDemand()
    const val = CONFIG.getd(key, dflt).retVal()
    return val
}

export function obaConfigMtimeMs() {
    const file = getObaConfigPath();
    const stats = statSync(file);
    return stats?.mtimeMs
}

export function getObaConfigPath(): string {
    const vaultDir = getVaultDir()
    return join(vaultDir, "Oba.jsonc")
}