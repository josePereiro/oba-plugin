import { FileSystemAdapter, Notice, Plugin } from 'obsidian';
import { existsSync, writeFileSync, mkdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { exec }  from 'child_process';

// Add a simple command 'Signal backend' which update a file in the plugin folder 
// that can be use as trigger for different backends

export default class ObA extends Plugin {

	async onload() {

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'oba-signal',
			name: 'Signal backend',
			callback: () => {
				setTimeout(() => { 
					const signal_id = randstring('O.', RAND_ID_LEN)
					const signal_file = this.getSignalPath();
					const plugin_dir = this.getPluginDir();
					new Notice("Oba: backend signaled");
					if (!existsSync(plugin_dir)) {
						mkdirSync(plugin_dir, { recursive: true })
					}
					console.log("backend signaled. signal_file: ", signal_file)
					console.log("backend signaled. signal_id: ", signal_id)
					console.log("backend signaled. plugin_dir: ", plugin_dir)
					
					const notepath = this.getCurrNote()
					console.log("backend signaled. notepath: ", notepath)
					const trigger_json = JSON.stringify({
						hash: signal_id, 
						path: notepath, 
					})
					console.log("backend signaled. trigger_json: ", trigger_json)
					writeFileSync(signal_file, trigger_json)
				}, SIGNAL_DELAY);
			}
		});

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'oba-code-vault',
			name: 'Open the vault in an IDE, ej: vscode',
			callback: () => {
				setTimeout(() => { 
					
					// load config file
					const configFile = this.getConfigFile()
					if (!existsSync(configFile)) {
						console.log("Config file missing!, configFile: ", configFile)
						return
					}
					let code = ''
					try {
						const data = readFileSync(configFile, 'utf8')
						// try parse
						const config = JSON.parse(data);
						console.log("config json:", config);

						const codekey = "edit.vault.shell.cmd"
						const _haskey = codekey in config
						if (!_haskey) { 
							console.log(`Unknown key, key: `, codekey)
							return
						} 
						code = config[codekey]
						if (typeof code !== 'string') {
							console.log(`Unformatted code section: `, code)
							return
						}

					} catch (err) {
						console.error("Error loading config", err);
						return
					}
					
					//  run code
					exec(code, (error, stdout, stderr) => {
						if (error) {
							console.log(`error: ${error.message}`);
							return;
						}
						if (stderr) {
							console.log(`stderr: ${stderr}`);
							return;
						}
						console.log(`stdout: ${stdout}`);
					});					
					
				}, SIGNAL_DELAY);
			}
		});
	}

	onunload() {

	}

	// ----..--.- .-. -.- .-. -.- ... . -- - 
	// Utils

	getCurrNote():string  {
		const currfile = this.app.workspace.getActiveFile();
		return (currfile === null) ? "" : currfile.path
	}

	getVaultDir(): string {
		let path;
		// base path
		if (this.app.vault.adapter instanceof FileSystemAdapter) {
			path = this.app.vault.adapter.getBasePath();
		} else {
			throw new Error('Cannot determine base path.');
		}
		return path
	}

	getConfigFile(): string {
		const vaultDir = this.getVaultDir()
		return join(vaultDir, "ObaServer.json")
	}

	getPluginDir(): string {
		const vaultDir = this.getVaultDir()
		const path = join(
			vaultDir, this.app.vault.configDir, 
			'plugins', "oba-plugin"
		)
		return path
	}

	// https://github.com/tillahoffmann/obsidian-jupyter/blob/e1e28db25fd74cd16844b37d0fe2eda9c3f2b1ee/main.ts#L175
	getSignalPath(): string {
		const fileName = "trigger-signal.json"
		const pluginDir = this.getPluginDir()
		const path = join(pluginDir, fileName)
		return path
	}
}

// ------------------------------------------------------------------
// static Utils
const RAND_ID_LEN = 8;
const SIGNAL_DELAY = 300; // let obsidian to save
const CHARACTERS  = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

function randstring(p: string, length: number): string {
	if (length < 1) { length = 1; }
    let rand = '';
    const charactersLength = CHARACTERS.length;
    for ( let i = 0; i < length; i++ ) {
        const rinx = Math.floor(Math.random() * charactersLength)
        rand += CHARACTERS.charAt(rinx);
    }
	return `${p}${rand}`
}