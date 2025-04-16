import { statSync } from 'fs';
import { join } from 'path';
import { checkEnable, JsonIO, tools } from '../tools-base/0-tools-modules';
import { OBA } from './globals';
import { vscode } from 'src/services-base/0-servises-modules';
import { getVaultDir } from 'src/tools-base/obsidian-tools';

/*
    Handle Oba confg file
*/

// export let CONFIG: { [key: string]: any } = {};
export let CONFIG: JsonIO = new JsonIO();

export function onload() {
    console.log("obaconfig:onload");
    
    // first load
    loadObaConfigOnDemand()

    OBA.addCommand({
        id: 'oba-obaconfig-open-confic-file',
        name: 'obaconfig open Oba.json',
        callback: async () => {
            checkEnable("obaconfig", true)
            console.clear()
            const path = getObaConfigPath()
            vscode.goto(path)
        }
    });
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
    return join(vaultDir, "Oba.json")
}