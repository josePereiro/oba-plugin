import { join } from 'path';
import { Notice } from 'obsidian';
import { existsSync, mkdirSync } from 'fs';
import { tools } from 'src/tools-base/0-tools-modules';
import { filesys } from 'src/oba-base/0-oba-modules';
import { callbacks } from './0-servises-modules';
import { OBA } from 'src/oba-base/globals';

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

// For others to store extra data to send to backends
export let BACKENDS_EXTRAS: { [key: string]: any };

export function onload() {
	console.log("BackEnds:onload");
	BACKENDS_EXTRAS = {}

	OBA.addCommand({
		id: 'oba-git-signal-backends',
		name: 'BackEnds signal backends',
		callback: async () => {
			signalBackend();
		}
	});
}

export function getBackEndsDir(): string {
	const obaDir = filesys.getObaDir();
	const _dir = join(obaDir, "backends");
	if (!existsSync(_dir)) {
		mkdirSync(_dir, { recursive: true });
	}
	return _dir;
}

/*
	Will contain just the dummy-hash
*/
export function getHashSignalPath(): string {
	return join(
		getBackEndsDir(), 
		"hash-signal.json"
	)
}

/*
	Will contain all signal data
*/
export function getStateSignalPath(): string {
	return join(
		getBackEndsDir(),
		"state-signal.json"
	)
}

// MARK: signalBackend
/*
	Call this to signal backends
*/ 
export async function signalBackend(extras = BACKENDS_EXTRAS) {
	console.log("signalBackend");

	const rlen = 15;
	const hash = tools.randstring('O.', rlen)
	
	const notepath = tools.getCurrNotePath();
	const selectionText = tools.getSelectedText();
	const selectionRange = tools.getSelectionRange();
	const cursorPos = tools.getCursorPosition();
	const callbackLast = callbacks.LAST_CALLBACK;

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
	await tools.writeJsonFileAsync(getStateSignalPath(), statesignal)
	await tools.writeJsonFileAsync(getHashSignalPath(), hashsignal)
	console.log("hashsignal:\n", hashsignal)
	console.log("statesignal:\n", statesignal)

	new Notice("Oba: backend signaled");
}
