import { Notice, Plugin } from 'obsidian';
import { ToolBox } from './tools';
import { Commands } from './commands';
import { GitService } from './gitService';
import { Callbacks } from './callbacks';
import { CrossrefService } from './crossref';

// This do:
// Add a simple command 'Signal backend' which update a file in the plugin folder 
// that can be use as trigger for different backends

export default class ObA extends Plugin {

	// services
	tools: ToolBox;
	cmds: Commands;
	gitService: GitService;
	callbackService: Callbacks;
	crossrefService: CrossrefService;
	
	// TODO: use unknown
	state: { [key: string]: any };
	callbacks: { [key: string]: (() => void)[] };
	
	// MARK: onload
	async onload() {

		console.log("onload")

		this.tools = new ToolBox(this);
		this.cmds = new Commands(this);
		this.gitService = new GitService(this);
		this.callbacks = {};
		this.callbackService = new Callbacks(this);
		this.crossrefService = new CrossrefService(this);
		this.state = {};

		// register commands/callbacks
		{
			// TODO: Think about it.
			// - Im calling a callback in a callback 
			// -- Connect what to call where in the configuration
			// -- Maybe just to have an action repo
			// --- "callback.oba-signal" : ["signalBackendCmd", "gitCommitCmd"]
			// ---- You can just use bracket notation
			this.callbackService.registerCallback("callback.oba-signal", () => this.cmds.signalBackendCmd())
			this.callbackService.registerCallback("callback.oba-signal", () => this.cmds.gitCommitCmd())
			this.addCommand({
				id: 'oba-signal',
				name: 'Signal backend',
				callback: () => {
					console.log("callback.oba-signal");
					this.callbackService.runCallbacks("callback.oba-signal")
				}
			});
		}

		{
			this.callbackService.registerCallback("callback.oba-code-vault", () => this.cmds.codeVaultCmd())
			this.addCommand({
				id: 'oba-code-vault',
				name: 'Open the vault in an IDE, ej: vscode',
				callback: () => {
					console.log("callback.oba-code-vault");
					this.callbackService.runCallbacks("callback.oba-code-vault")
				}
			});
		}

		{
			this.callbackService.registerCallback("callback.oba-crossref-seach-cmd", () => {
				this.crossrefService.fetchDoiReference();
			})
			this.addCommand({
				id: 'oba-crossref-seach-cmd',
				name: 'Search references',
				callback: () => {
					console.log("callback.oba-crossref-seach-cmd");
					this.callbackService.runCallbacks("callback.oba-crossref-seach-cmd")
				}
			});
		}

		{
			this.callbackService.registerCallback("callback.oba-dev-cmd", () => {
				new Notice('hello oba')
			})
			this.addCommand({
				id: 'oba-dev-cmd',
				name: 'Dev cmd',
				callback: () => {
					console.log("callback.oba-dev-cmd");
					this.callbackService.runCallbacks("callback.oba-dev-cmd")
				}
			});
		}

	}

	onunload() {
		console.log('oba-plugin: onunload');
	}
}

