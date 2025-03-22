// TODO/DOING: mobe servises to modules

import { Plugin } from 'obsidian';
import * as globals from './0-base/globals';
import * as tools from './tools-base/0-tools';

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

		// commands
		this.addCommand({
            id: 'obaplugin-dev',
            name: 'ObAPlugin dev',
            callback: async () => {
                console.clear();
                const obadir = tools.getCurrNotePathErr();
				console.log(obadir);
            }
        });
	}

	onunload() {
		console.log('ObAPlugin:onunload');
	}
}

