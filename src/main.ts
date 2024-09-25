import { FileSystemAdapter, Notice, Plugin } from 'obsidian';
import { existsSync, writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';

// Add a simple command 'Signal backend' which update a file in the plugin folder 
// that can be use as trigger for different backends

export default class ObA extends Plugin {

	async onload() {

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'oba-plugin',
			name: 'Signal backend',
			callback: () => {
				setTimeout(() => { 
					const signal_id = `O.${randstring(RAND_ID_LEN)}`
					const signal_file = this.getSignalPath();
					const plugin_dir = dirname(signal_file);
					new Notice("Oba: backend signaled");
					if (!existsSync(plugin_dir)) {
						mkdirSync(plugin_dir, { recursive: true })
					}
					console.log("backend signaled. signal_file: ", signal_file)
					console.log("backend signaled. signal_id: ", signal_id)
					console.log("backend signaled. plugin_dir: ", plugin_dir)
					
					const currfile = this.app.workspace.getActiveFile();
					const currpath = (currfile === null) ? "" : currfile.path
					console.log("backend signaled. currpath: ", currpath)
					const trigger_json = JSON.stringify({
						hash: signal_id, 
						path: currpath, 
					})
					console.log("backend signaled. trigger_json: ", trigger_json)
					writeFileSync(signal_file, trigger_json)
				}, SIGNAL_DELAY);
			}
		});
	}

	onunload() {

	}

	// https://github.com/tillahoffmann/obsidian-jupyter/blob/e1e28db25fd74cd16844b37d0fe2eda9c3f2b1ee/main.ts#L175
	getSignalPath(): string {
		const fileName = "trigger-signal.json"
		let basePath;
		// base path
		if (this.app.vault.adapter instanceof FileSystemAdapter) {
			basePath = this.app.vault.adapter.getBasePath();
		} else {
			throw new Error('Cannot determine base path.');
		}
		// relative path
		// const relativePath = `${this.app.vault.configDir}/plugins/oba-plugin/${fileName}`;
		const path = join(
			basePath, this.app.vault.configDir, 
			'plugins', "oba-plugin", fileName
	)
		// const relativePath = `${this.app.vault.configDir}/plugins/oba-plugin/${fileName}`;
		// absolute path
		// return `${basePath}/${relativePath}`;
		return path
	}
}

// ------------------------------------------------------------------
// Utils
const RAND_ID_LEN = 8;
const SIGNAL_DELAY = 300; // let obsidian to save
const CHARACTERS  = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

function randstring(length: number): string {
	if (length < 1) { length = 1; }
    let result = '';
    const charactersLength = CHARACTERS.length;
    for ( let i = 0; i < length; i++ ) {
        const rinx = Math.floor(Math.random() * charactersLength)
        result += CHARACTERS.charAt(rinx);
    }
   return result;
}