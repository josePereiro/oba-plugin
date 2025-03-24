// TODO/DOING: mobe servises to modules

import { Plugin } from 'obsidian';
import * as globals from './oba-base/globals';
import * as tools from './tools-base/0-tools-base';
import { dev } from './services/0-servises';
import { biblio } from './biblio-base/0-biblio-base';
import { configfile } from './oba-base/0-oba-base';

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

		// init servises
		configfile.onload()
		dev.onload()
		tools.onload()
		biblio.onload()
	}

	onunload() {
		console.log('ObAPlugin:onunload');
	}
}

