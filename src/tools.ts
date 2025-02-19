import { FileSystemAdapter } from 'obsidian';
import { join } from 'path';
import ObA from './main';
import { existsSync, readFileSync } from 'fs';

export class ToolBox {
    constructor(private oba: ObA) {}
  
    // ----..--.- .-. -.- .-. -.- ... . -- - 
	// MARK: Obsidian

	getCurrNote():string  {
		const currfile = this.oba.app.workspace.getActiveFile();
		return (currfile === null) ? "" : currfile.path
	}

	getVaultDir(): string {
		let path;
		// base path
		if (this.oba.app.vault.adapter instanceof FileSystemAdapter) {
			path = this.oba.app.vault.adapter.getBasePath();
		} else {
			throw new Error('Cannot determine base path.');
		}
		return path
	}

    // ----..--.- .-. -.- .-. -.- ... . -- - 
    // MARK: Oba

	getObaConfigFile(): string {
		const vaultDir = this.getVaultDir()
		return join(vaultDir, "ObaServer.json")
	}

	getObaPluginDir(): string {
		const vaultDir = this.getVaultDir()
		const path = join(
			vaultDir, this.oba.app.vault.configDir, 
			'plugins', "oba-plugin"
		)
		return path
	}

	// https://github.com/tillahoffmann/obsidian-jupyter/blob/e1e28db25fd74cd16844b37d0fe2eda9c3f2b1ee/main.ts#L175
	getObaSignalPath(): string {
		const fileName = "trigger-signal.json"
		const pluginDir = this.getObaPluginDir()
		const path = join(pluginDir, fileName)
		return path
	}

    // read a key in the config file
    // TODO: only read if file change
    readConfig(key: string, dflt: any = null) {
        // load config file
        const configFile = this.oba.tools.getObaConfigFile()
        if (!existsSync(configFile)) {
            console.log("Config file missing!, configFile: ", configFile)
            return
        }
        try {
            const data = readFileSync(configFile, 'utf8')
            // try parse
            const config = JSON.parse(data);
            console.log("config json:", config);

            if (!(key in config)) { 
                console.log(`Unknown key, key: `, key)
                return
            } 
            return config?.[key] ?? dflt
        } catch (err) {
            console.error("Error loading config", err);
            return
        }
    }

	async copyToClipboard(text: string) {
        try {
            await navigator.clipboard.writeText(text);
            console.log('Text copied to clipboard:', text);
        } catch (err) {
            console.error('Failed to copy text:', err);
        }
    }

	getSelectedText() : string {
        const editor = this.oba.app.workspace.activeEditor?.editor;
        if (editor) {
            const selectedText = editor.getSelection();
            if (selectedText) {
                return selectedText;
            } else {
                return '';
            }
        }
    }

}

