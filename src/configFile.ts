import ObA from './main-old';
import { existsSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

/*
    Handle Oba confg file
*/
export class ConfigFile {
    
    config: { [key: string]: any };
    configPath: string;

    constructor(private oba: ObA) {
        console.log("ConfigFile:constructor");

        this.config = {}
        this.configPath = this.getObaConfigPath();

        // first load
        this.loadConfig()
    }

    loadConfig() : boolean {
        try {
            if (!existsSync(this.configPath)) {
                console.log("Config file missing!, configPath: ", this.configPath);
                return false
            }

            // Check modified
            const lastMtimeMs = this.config?.["Oba.ConfigFile.last.load.mtimeMs"];
            const currMtimeMs = this.obaConfigMtimeMs();
            const doUpdate = lastMtimeMs == null || lastMtimeMs != currMtimeMs
            if (!doUpdate) { return false }

            // load
            const data = readFileSync(this.configPath, 'utf8')
            this.config = JSON.parse(data); // try parse
            this.config["Oba.ConfigFile.last.load.mtimeMs"] = currMtimeMs;
            console.log("config loaded!");
            console.log(this.config);

        } catch (err) {
            console.error("Error loading config", err);
            return false
        }
        return true
    }   

    // read a key in the config file
    getConfig(key: string, dflt: any = null) {
        try {
            this.loadConfig();
            if (!(key in this.config)) { 
                console.warn(`Unknown key, key: `, key)
                return dflt
            } else {
                return this.config[key]
            }
        } catch (err) {
            console.warn("Error reading config", err);
            this.loadConfig();
            return dflt
        }
    }

    obaConfigMtimeMs() {
        const file = this.getObaConfigPath();
        const stats = statSync(file);
        return stats.mtimeMs
    }
    

    getObaConfigPath(): string {
		const vaultDir = this.oba.tools.getVaultDir()
		return join(vaultDir, "Oba.json")
	}
}