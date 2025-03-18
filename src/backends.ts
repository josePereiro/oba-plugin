import { join } from 'path';
import ObA from './main';
import { Notice } from 'obsidian';
import { existsSync, mkdirSync } from 'fs';

/*
	Deal with signals to backends.
	- signals are just json files on the .oba/backends folders
	- signals should include only useful state variables from Obsidian
		- for instance
			- active note
			- cursor position
			- selected text
			- selected text positions
			- opened notes
			- recent files
	- All the rest must be handled by the backends
		- for instance
			- parsing
			- editing notes
*/
export class BackEnds {
	// For others to store extra data to send to backends
	extras: { [key: string]: any };

    constructor(private oba: ObA) {
		console.log("BackEnds:constructor");
		this.extras = {}
    }

	getBackEndsDir(): string {
        const obaDir = this.oba.tools.getObaDir();
        const _dir = join(obaDir, "backends");
        if (!existsSync(_dir)) {
            mkdirSync(_dir, { recursive: true });
        }
        return _dir;
    }

	/*
		Will contain just the dummy-hash
	*/
	getHashSignalPath(): string {
		return join(
			this.getBackEndsDir(), 
			"hash-signal.json"
		)
	}

	/*
		Will contain all signal data
	*/
	getStateSignalPath(): string {
		return join(
            this.getBackEndsDir(),
            "state-signal.json"
        )
	}

	// MARK: signalBackend
	/*
		Call this to signal backends
	*/ 
	signalBackend(extras = this.extras) {
		console.log("signalBackend");

		const rlen = 15;
		const hash = this.oba.tools.randstring('O.', rlen)
		
		const notepath = this.oba.tools.getCurrNotePath();
		const selectionText = this.oba.tools.getSelectedText();
		const selectionRange = this.oba.tools.getSelectionRange();
		const cursorPos = this.oba.tools.getCursorPosition();
		const callbackLast = this.oba.callbacks.lastCalled;

		const hashsignal = { 
			"signal.hash": hash
		}
		const statesignal = { 
			"signal.hash": hash, 
			"active.note.path": notepath, 
			"selection.text": selectionText,
			"selection.range": selectionRange,
			"cursor.pos": cursorPos,
			"callbacks.last": callbackLast,
			"backends.extras": extras,
		}

		// Order is important
		// backends must be listening 
		this.oba.tools.writeJSON(this.getStateSignalPath(), statesignal)
		this.oba.tools.writeJSON(this.getHashSignalPath(), hashsignal)
		console.log("hashsignal:\n", hashsignal)
		console.log("statesignal:\n", statesignal)

		new Notice("Oba: backend signaled");
	}
}
