import { EditorPosition, FileSystemAdapter, MarkdownView, Notice, TFile } from 'obsidian';
import { join } from 'path';
import ObA from './main';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'fs';

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
		return path;
	}

	getObaDir(): string {
		const vault = this.getVaultDir();
		const obaDir = join(vault, ".Oba");
		if (!existsSync(obaDir)) {
			mkdirSync(obaDir, { recursive: true });
		}
		return obaDir;
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
			new Notice("No note opened.");
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

	getTags(file: TFile) {
		const metadata = this.oba.app.metadataCache.getFileCache(file);
		return metadata?.tags
	}

	hasTag(file: TFile, tag0: string) {
        const tags = this.getTags(file);
        // console.log("tags: ", metadata?.tags)
        return tags?.some(tag => tag.tag === tag0);
    }

	getNotePath(noteName: string) {
		this.oba.app.metadataCache.getFirstLinkpathDest(noteName, '')
	}

	// TODO: Move to Dev
	async askLLM(question: string): Promise<string> {
		// const API_URL = "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.1";
		// const API_URL = "https://api-inference.huggingface.co/models/gpt2";
		// const API_URL = "https://api-inference.huggingface.co/models/deepseek-ai/DeepSeek-R1";
		const API_URL = "https://api-inference.huggingface.co/models/";
		
		// const API_TOKEN = "YOUR_HUGGINGFACE_API_KEY"; // Sostituiscilo con la tua chiave API gratuita
		const API_TOKEN = this.oba.configfile.readConfig("huggingface.access.token", null)
		if (!API_TOKEN) {
			new Notice("'huggingface.access.token' missing")
			return;
		}
	
		const response = await fetch(API_URL, {
			method: "POST",
			headers: {
				"Authorization": `Bearer ${API_TOKEN}`,
				"Content-Type": "application/json"
			},
			body: JSON.stringify({ inputs: question })
		});
	
		const data = await response.json();
		
		if (data.error) {
			throw new Error(`Errore API: ${data.error}`);
		}
	
		return data[0]?.generated_text || "No response";
	}


	loadJSON(path: string) {
		try {
			if (!existsSync(path)) {
				console.error("File missing", path);
				return null
			}
			const data = readFileSync(path, 'utf8')
			const obj = JSON.parse(data); // try parse
			return obj
		} catch (err) {
			console.error("Error loading", err);
			return null
		}
	}

	writeJSON(path: string, obj) {
		try {
			const jsonString = JSON.stringify(obj, null, 2);
			writeFileSync(path, jsonString, 'utf-8');
			console.log(`Object successfully stored as JSON at: ${path}`);
		} catch (error) {
			console.error('Error storing object as JSON:', error);
		}
	}

	uriToFilename(url: string): string {
        // Replace invalid characters with underscores
        let filename = url
            .replace(/[/\\:*?"<>|#]/g, '_') // Replace invalid characters
            .replace(/https?:\/\//, '')       // Remove 'http://' or 'https://'
            .replace(/\./g, '_')              // Replace dots with underscores
            .replace(/\s+/g, '_');            // Replace spaces with underscores
    
        // Trim the filename to a reasonable length (e.g., 255 characters)
        const maxLength = 255;
        if (filename.length > maxLength) {
            filename = filename.substring(0, maxLength);
        }
    
        return filename;
    }

	getMoreRecentlyModified(file1: string, file2: string): string {
		try {
			// Get stats for both files
			const stats1 = statSync(file1);
			const stats2 = statSync(file2);
	
			// Compare modification times
			if (stats1.mtimeMs > stats2.mtimeMs) {
				return file1;
			} else {
				return file2;
			}
		} catch (error) {
			console.error('Error comparing file modification times:', error);
			return '';
		}
	}

}

