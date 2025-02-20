import ObA from './main';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

export class ConfigFile {
    config: { [key: string]: any };
    configPath: string;

    constructor(private oba: ObA) {
        console.log("ConfigFile:constructor");

        this.config = {}
        this.configPath = this.getObaConfigFile();

        // first load
        this.loadConfig()
        
        // load on changed
        this.oba.registerEvent(
            this.oba.app.vault.on('modify', (file) => {
                if (file.path === this.configPath) {
                    console.log('configfile changed!');
                    this.loadConfig()
                }
            })
        );
    }

    // TODO: implement ram cache
    // TODO: only config file is it was changed
    loadConfig() : boolean {
        try {
            if (!existsSync(this.configPath)) {
                console.log("Config file missing!, configPath: ", this.configPath)
                return false
            }
            const data = readFileSync(this.configPath, 'utf8')
            this.config = JSON.parse(data); // try parse
            console.log("config loaded!");
            console.log(this.config);
        } catch (err) {
            console.error("Error loading config", err);
            return false
        }
        return true
    }   

    // read a key in the config file
    readConfig(key: string, dflt: any = null) {
        try {
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

    getObaConfigFile(): string {
		const vaultDir = this.oba.tools.getVaultDir()
		return join(vaultDir, "Oba.json")
	}
}