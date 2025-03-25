// TODO/DOING: mobe servises to modules

import { Plugin } from 'obsidian';
import { globals } from './oba-base/0-oba-modules';
import { tools } from './tools-base/0-tools-modules';
import { backends, callbacks, commands, dev, git, markerpdf, mdjson, obanotes, obauri, pdfrepo, replacer, tagnotices, vscode } from './services-base/0-servises-modules';
import { biblio } from './biblio-base/0-biblio-modules';
import { configfile } from './oba-base/0-oba-modules';
import { OBA } from './oba-base/globals';
import { citnotes } from './citnotes-base/0-citnotes-modules';

// NOTES

// TODO:
// Create an universal template system
// That is, any subsystem can inject stuff from the current state of Oba
// example: An TagNotice which message is "{{ACTIVE_FILE}} contains TODOs"

export default class ObAPlugin extends Plugin {
	
	// MARK: onload
	async onload() {

		console.clear()
		console.log("ObAPlugin:onload")

		// Set globals
		globals.setOba(this);
		console.log(OBA)

		// init modules
		callbacks.onload()
		configfile.onload()
		dev.onload()
		tools.onload()
		biblio.onload()
		vscode.onload()
		git.onload()
		backends.onload()
		commands.onload()
		pdfrepo.onload()
		markerpdf.onload()
		mdjson.onload()
		obanotes.onload()
		tagnotices.onload()
		citnotes.onload()
		obauri.onload()
		replacer.onload()
	}

	onunload() {
		console.log('ObAPlugin:onunload');
	}
}

