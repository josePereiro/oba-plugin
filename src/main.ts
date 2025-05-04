// TODO/DOING: mobe servises to modules

import { Plugin } from 'obsidian';
import { biblio } from './biblio-base/0-biblio-modules';
import { citnotes } from './citnotes-base/0-citnotes-modules';
import { gittools } from './gittools-base/0-gittools-modules';
import { obaconfig } from './oba-base/0-oba-modules';
import { setOba } from './oba-base/globals';
import { obasync } from './obasync-base/0-obasync-modules';
import { obascheduler } from './scheduler-base/0-scheduler-module';
import { backends, callbacks, commands, dev, git, intervals, markerpdf, mdjson, obanotes, obaup, obauri, pdfrepo, replacer, scihub, statusbar, tagnotices, vscode } from './services-base/0-servises-modules';
import { tests } from './tests-base/0-tests-modules';
import { tools } from './tools-base/0-tools-modules';

// NOTES

// TODO:
// Create an universal template system
// That is, any subsystem can inject stuff from the current state of Oba
// example: An TagNotice which message is "{{ACTIVE_FILE}} contains TODOs"

/*
	TODO/ make a collect all command
	- It will copy into the clipboard all matches to a given regex
*/ 

/*
	TODO/ create addObaCommand
	- interface with the enable configs
	- Handle naming homogeneity
	- handle scheduling (At least one schedule per service)
*/ 

export default class ObAPlugin extends Plugin {
	
	// MARK: onload
	async onload() {

		console.clear()
		console.log("ObAPlugin:onload")

		// Setup globals
		setOba(this);

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
		gittools.onload()
		obascheduler.onload()
	}

	onunload() {
		console.log('ObAPlugin:onunload');
		obascheduler.onunload()
		statusbar.onunload();
		obasync.onunload();
	}
}

