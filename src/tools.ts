import { Editor, EditorPosition, FileSystemAdapter, MarkdownView, Notice, TFile } from 'obsidian';
import { join } from 'path';
import ObA from './main';

export class ToolBox {
    constructor(private oba: ObA) {
		console.log("ToolBox:constructor")
	}
  
    // ----..--.- .-. -.- .-. -.- ... . -- - 
	// MARK: Obsidian

	getCurrNote(): TFile | null  {
		return this.oba.app.workspace.getActiveFile();
	}
	getCurrNotePath(): string  {
		const _note = this.oba.tools.getCurrNote();
		return _note ? _note.path : '';
	}

	getVaultDir(): string {
		let path;
		// base path
		if (this.oba.app.vault.adapter instanceof FileSystemAdapter) {
			path = this.oba.app.vault.adapter.getBasePath();
		} else {
			throw new Error('Cannot determine base path.');
		}
		return path
	}

	async copyToClipboard(text: string) {
        try {
            await navigator.clipboard.writeText(text);
            console.log('Text copied to clipboard:', text);
        } catch (err) {
            console.error('Failed to copy text:', err);
        }
    }

	getSelectedText() : string {
        const editor = this.oba.app.workspace.activeEditor?.editor;
        if (editor) {
            const selectedText = editor.getSelection();
            return selectedText ? selectedText : ''
        }
    }

	randstring(p: string, length: number): string {

		console.log("length ", length)
		const CHARACTERS  = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

		if (length < 1) { length = 1; }
		let rand = '';
		const charactersLength = CHARACTERS.length;
		for ( let i = 0; i < length; i++ ) {
			const rinx = Math.floor(Math.random() * charactersLength)
			rand += CHARACTERS.charAt(rinx);
		}
		console.log("rand ", rand)
		return `${p}${rand}`
	}

	insertAtCursor(txt: string) {
		const view = this.oba.app.workspace.getActiveViewOfType(MarkdownView);
		if (!view) {
			new Notice("Nessuna nota aperta.");
			return;
		}
		
		const cursor: EditorPosition = view.editor.getCursor()
		view.editor.replaceRange(txt, cursor);
	}

	getTagsForFile(file: TFile): string[] | null {
        const metadata = this.oba.app.metadataCache.getFileCache(file);
        if (metadata && metadata.tags) {
            return metadata.tags.map((tag) => tag.tag);
        }
        return null;
    }

	
    // ----..--.- .-. -.- .-. -.- ... . -- - 
    // MARK: Oba

	getObaPluginDir(): string {
		const vaultDir = this.getVaultDir()
		const path = join(
			vaultDir, this.oba.app.vault.configDir, 
			'plugins', "oba-plugin"
		)
		return path
	}


	readJsonMd(file: string) {

	}

}

