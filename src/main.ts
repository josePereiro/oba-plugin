import { Notice, Plugin } from 'obsidian';
import { ToolBox } from './tools';
import { Commands } from './commands';
import { Callbacks } from './callbacks';
import { CrossRef } from './crossref';
import { BackEnds } from './backends';
import { Git } from './git';
import { ConfigFile } from './configFile';

// This do:
// Add a simple command 'Signal backend' which update a file in the plugin folder 
// that can be use as trigger for different backends

export default class ObA extends Plugin {

	// services
	git: Git;
	tools: ToolBox;
	cmds: Commands;
	crossref: CrossRef;
	backends: BackEnds;
	callbacks: Callbacks;
	configfile: ConfigFile;
	
	// TODO: use unknown
	// state: { [key: string]: any };
	
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
				() => {
					this.tools.insertAtCursor(this.tools.randstring("test.", 8))
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

