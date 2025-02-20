import { join } from 'path';
import ObA from './main';
import { Notice } from 'obsidian';
import { existsSync, mkdirSync, writeFileSync } from 'fs';

export class BackEnds {

    constructor(private oba: ObA) {
		console.log("BackEnds:constructor");
    }

    // https://github.com/tillahoffmann/obsidian-jupyter/blob/e1e28db25fd74cd16844b37d0fe2eda9c3f2b1ee/main.ts#L175
	getObaBackEndSgnalPath(): string {
		const fileName = "backend-signal.json"
		const pluginDir = this.oba.tools.getObaPluginDir()
		const path = join(pluginDir, fileName)
		return path
	}

	// MARK: signalBackend
	// TODO Move to backEnds
	signalBackend() {
		console.log("signalBackend");
		const signalDelay = this.oba.configfile.readConfig("signal.delay", 300);
		setTimeout(() => { 
			const rlen = this.oba.configfile.readConfig("signal.rand.id.len", 8);
			console.log("rlen ", rlen)
			const signal_id = this.oba.tools.randstring('O.', rlen)
			const signal_file = this.getObaBackEndSgnalPath();
			const plugin_dir = this.oba.tools.getObaPluginDir();
			new Notice("Oba: backend signaled");
			if (!existsSync(plugin_dir)) {
				mkdirSync(plugin_dir, { recursive: true })
			}
			console.log("backend signaled. signal_file: ", signal_file);
			console.log("backend signaled. signal_id: ", signal_id);
			console.log("backend signaled. plugin_dir: ", plugin_dir);
			
			const notepath = this.oba.tools.getCurrNotePath();
			console.log("backend signaled. notepath: ", notepath)

			const selection = this.oba.tools.getSelectedText();
			console.log("backend signaled. selection: ", selection)

			const triggerJSON = JSON.stringify({
				hash: signal_id, 
				path: notepath, 
				selection: selection
			})
			console.log("backend signaled. triggerJSON: ", triggerJSON)
			writeFileSync(signal_file, triggerJSON)
		}, signalDelay);
	}
}
