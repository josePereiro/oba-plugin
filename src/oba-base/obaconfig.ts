import { statSync } from 'fs';
import { join } from 'path';
import * as tools from '../tools-base/0-tools-modules';
import { OBA } from './globals';
import { vscode } from 'src/services-base/0-servises-modules';

/*
    Handle Oba confg file
*/

export let CONFIG: { [key: string]: any } = {};

export function onload() {
    console.log("obaconfig:onload");
    
    // first load
    loadConfig()

    OBA.addCommand({
        id: 'oba-obaconfig-open-confic-file',
        name: 'obaconfig open Oba.json',
        callback: async () => {
            vscode.goto(getObaConfigPath())
        }
    });
}

export function loadConfig() : boolean {
    try {
        
        // Check file
        const configPath = getObaConfigPath()
        const ev = tools.compareMtimeMsCached(configPath, 'loadConfig')
        if (ev["file.intact"]) { return false }

        // load
        const json = tools.loadJSONSync(configPath)
        if (!json) { return false; }
        CONFIG = json; // update
        console.log("config loaded!");
        console.log(CONFIG);

    } catch (err) {
        console.error("Error loading config", err);
        return false
    }
    return true
}   

// read a key in the config file
export function getConfig(key: string, dflt: any = null) {
    try {
        loadConfig();
        if (!(key in CONFIG)) { 
            console.warn(`Unknown key, key: `, key)
            return dflt
        } else {
            return CONFIG[key]
        }
    } catch (err) {
        console.warn("Error getting config", err);
        return dflt
    }
}

export function obaConfigMtimeMs() {
    const file = getObaConfigPath();
    const stats = statSync(file);
    return stats?.mtimeMs
}

export function getObaConfigPath(): string {
    const vaultDir = tools.getVaultDir()
    return join(vaultDir, "Oba.json")
}