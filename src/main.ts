// TODO/DOING: mobe servises to modules

import { Plugin } from 'obsidian';
import { globals } from './oba-base/0-oba-modules';
import { tools } from './tools-base/0-tools-modules';
import { backends, callbacks, commands, dev, git, intervals, markerpdf, mdjson, obanotes, obaup, obauri, pdfrepo, replacer, scihub, statusbar, tagnotices, vscode } from './services-base/0-servises-modules';
import { biblio } from './biblio-base/0-biblio-modules';
import { obaconfig } from './oba-base/0-oba-modules';
import { citnotes } from './citnotes-base/0-citnotes-modules';
import { tests } from './tests-base/0-tests-modules';
import { obasync} from './obasync-base/0-obasync-modules';

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

		// init modules
		callbacks.onload()
		obaconfig.onload()
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
		tests.onload()
		statusbar.onload()
		intervals.onload()
		scihub.onload()
		obaup.onload()
		obasync.onload()
	
	}

	onunload() {
		console.log('ObAPlugin:onunload');
		statusbar.onunload();
		obasync.onunload();
	}
}

