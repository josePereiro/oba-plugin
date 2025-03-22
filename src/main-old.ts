
// TODO DELETE
// TODO/DOING: mobe servises to modules

import { Plugin } from 'obsidian';
import { ToolBox } from './tools-base/0-tools';
import { Commands } from './commands';
import { Callbacks } from './callbacks';
import { CrossRef } from './biblio-base/crossref';
import { BackEnds } from './backends';
import { Git } from './git';
import { ConfigFile } from './configFile';
import { TagNotices } from './tag.notices';
import { RangeView } from './view';
import { OpenPdf } from './open.pdf';
import { LocalBibs } from './biblio-base/localbibs';
import { Dev } from './dev';
import { CitationNotes } from './citation.notes';
import { VSCode } from './vscode';
import { MarkerPDF } from './marker.pdf';
import { ObaNotes } from './obanotes';
import { BiblIO } from './biblio-base/0-biblio';
import { setOba } from './0-base/globals';

// NOTES

// TODO:
// Create an universal template system
// That is, any subsystem can inject stuff from the current state of Oba
// example: An TagNotice which message is "{{ACTIVE_FILE}} contains TODOs"

export default class ObAPlugin extends Plugin {

	// services
	git: Git;
	tools: ToolBox;
	commands: Commands;
	crossref: CrossRef;
	backends: BackEnds;
	callbacks: Callbacks;
	configfile: ConfigFile;
	tagnotices: TagNotices;
	rangeview: RangeView;
	openpdfs: OpenPdf;
	localbibs: LocalBibs;
	vscode: VSCode;
	citnotes: CitationNotes;
	markerpdf: MarkerPDF;
	obanotes: ObaNotes;
	biblio: BiblIO;
	dev: Dev;
	
	// MARK: onload
	async onload() {

		console.clear()
		console.log("ObA:onload")

		// Set globals
		setOba(this);

		// Order matter
		this.tools = new ToolBox(this); // 1
		this.commands = new Commands(this);
		this.callbacks = new Callbacks(this);
		this.git = new Git(this);
		this.crossref = new CrossRef(this);
		this.backends = new BackEnds(this);
		this.configfile = new ConfigFile(this);
		this.tagnotices = new TagNotices(this);
		this.openpdfs = new OpenPdf(this);
		this.localbibs = new LocalBibs(this);
		this.vscode = new VSCode(this);
		this.citnotes = new CitationNotes(this);
		this.markerpdf = new MarkerPDF(this);
		this.obanotes = new ObaNotes(this);
		this.biblio = new BiblIO(this);
		this.dev = new Dev(this);
		// this.rangeview = new RangeView(this);

	}

	sayHi() {
		console.log("Hi from ObAPlugin")
	}

	onunload() {
		console.log('Oba:onunload');
	}
}

