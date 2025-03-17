import { Notice, Plugin } from 'obsidian';
import { ToolBox } from './tools';
import { Commands } from './commands';
import { Callbacks } from './callbacks';
import { CrossRef } from './crossref';
import { BackEnds } from './backends';
import { Git } from './git';
import { ConfigFile } from './configFile';
import { TagNotices } from './tag.notices';
import { SelectorModal } from './modals';
import { RangeView } from './view';
import { OpenPdf } from './open.pdf';
import { LocalBibs } from './localbibs';
import { Dev } from './dev';
import { CitationNotes } from './citation.notes';

// NOTES

// TODO:
// Create an universal template system
// That is, any subsystem can inject stuff from the current state of Oba
// example: An TagNotice which message is "{{ACTIVE_FILE}} contains TODOs"

export default class ObA extends Plugin {

	// services
	git: Git;
	tools: ToolBox;
	cmds: Commands;
	crossref: CrossRef;
	backends: BackEnds;
	callbacks: Callbacks;
	configfile: ConfigFile;
	tagnotices: TagNotices;
	rangeview: RangeView;
	openpdfs: OpenPdf;
	localbibs: LocalBibs;
	citnotes: CitationNotes;
	dev: Dev;
	
	// MARK: onload
	async onload() {

		console.clear()
		console.log("ObA:onload")

		// Order matter
		this.tools = new ToolBox(this); // 1
		this.callbacks = new Callbacks(this);
		this.git = new Git(this);
		this.cmds = new Commands(this);
		this.crossref = new CrossRef(this);
		this.backends = new BackEnds(this);
		this.configfile = new ConfigFile(this);
		this.tagnotices = new TagNotices(this);
		this.openpdfs = new OpenPdf(this);
		this.localbibs = new LocalBibs(this);
		this.citnotes = new CitationNotes(this);
		this.dev = new Dev(this);
		// this.rangeview = new RangeView(this);

	}

	onunload() {
		console.log('Oba:onunload');
	}
}

