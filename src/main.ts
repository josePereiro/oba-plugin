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
import { BibTex } from './bibtex';

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
	bibtex: BibTex;
	
	// MARK: onload
	async onload() {

		console.log("ObA:onload")

		this.tools = new ToolBox(this); // Must be first
		
		this.git = new Git(this);
		this.cmds = new Commands(this);
		this.crossref = new CrossRef(this);
		this.backends = new BackEnds(this);
		this.callbacks = new Callbacks(this);
		this.configfile = new ConfigFile(this);
		this.tagnotices = new TagNotices(this);
		this.openpdfs = new OpenPdf(this);
		this.bibtex = new BibTex(this);
		// this.rangeview = new RangeView(this);

		// MARK: # commands
		// register commands/callbacks
		{
			// TODO: Think about it.
			// - Im calling a callback in a callback 
			// -- Connect what to call where in the configuration
			// -- Maybe just to have an action repo
			// --- "callback.oba-signal" : ["signalBackendCmd", "gitCommitCmd"]
			// ---- You can just use bracket notation
			this.callbacks.registerCallback("callback.oba-signal", 
				() => this.backends.signalBackend(),
				() => this.git.gitCommitCmd()
			)
			this.addCommand({
				id: 'oba-signal',
				name: 'Signal backend',
				callback: () => {
					this.callbacks.runCallbacks("callback.oba-signal")
				}
			});
		}

		// TODO: Move to general commands
		// register callbacks in each servise constructor
		{
			this.callbacks.registerCallback("callback.oba-code-vault", 
				() => this.cmds.codeVaultCmd()
			)
			this.addCommand({
				id: 'oba-code-vault',
				name: 'Open the vault in an IDE, ej: vscode',
				callback: () => {
					this.callbacks.runCallbacks("callback.oba-code-vault")
				}
			});
		}

		{
			this.callbacks.registerCallback("callback.oba-crossref-search-cmd", 
				() => this.crossref.fetchDoiReference()
			)
			this.addCommand({
				id: 'oba-crossref-search-cmd',
				name: 'Search references for the selected doi',
				callback: () => {
					this.callbacks.runCallbacks("callback.oba-crossref-search-cmd")
				}
			});
		}

		{
			this.callbacks.registerCallback("callback.oba-dev-cmd", 
				() => { new Notice('hello oba') }, 
				// () => {
				// 	const question = this.tools.getSelectedText();
				// 	this.tools.askLLM(question).then(console.log).catch(console.error);
				// },
				// () => {
				// 	this.tools.insertAtCursor(this.tools.randstring("test.", 8))
				// }
				() => {
					// Usage
					const colorModal = new SelectorModal(this, ["A", "B", "C"]);
					colorModal.open();
				}
			)
			this.addCommand({
				id: 'oba-dev-cmd',
				name: 'Dev cmd',
				callback: () => {
					this.callbacks.runCallbacks("callback.oba-dev-cmd")
				}
			});
		}
	}

	onunload() {
		console.log('Oba:onunload');
	}
}

