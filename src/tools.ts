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
	getCurrNotePath(): string | null  {
		return this.oba.tools.getCurrNote()?.path;
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
            console.log('Text copied to clipboard:\n', text);
        } catch (err) {
            console.error('Failed to copy text:\n', err);
        }
    }

	getSelectedText() : string {
        const editor = this.oba.app.workspace.activeEditor?.editor;
        if (editor) {
            const selectedText = editor.getSelection();
			console.log("selectedText:\n ", selectedText);
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
			console.log(`JSON written at: ${path}`);
		} catch (error) {
			console.error(`Error writing JSON: ${error}`);
		}
	}

	uriToFilename(url: string): string {
        // Replace invalid characters with underscores
        let filename = url
            .replace(/[/\\:*?"<>|#]/g, '_')   // Replace invalid characters
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

	fixPoint(str0: string, fun) {
        let str1;
        while (true){
            str1 = fun(str0)
            if (str1 == str0) { break; }
            str0 = str1
        }
        return str0
    }

	getFirst(obj0, keys) {
        let elm = undefined;
        for (const key of keys) {
            if (elm) { return elm; }
            elm = obj0?.[key]
        }
        return elm;
    }

	sleep(ms: number) {
		setTimeout(() => {}, ms); // 1000 milliseconds = 1 second
	}

	_identity(obj) {
        return obj
    }

	findStr(
        {   
            str0 = null,
            keys = null,
            objList = null,
            foundFun = this._identity,
            getEntry = this._identity 
        } : {
            str0?: string | null;
            keys?: string[] | null;
            objList?: any[] | null;
            foundFun?: (str0: string, str1: string) => boolean;
            getEntry?: (entry: any) => any;
        } = {}
    ){
        if (!str0) { return null; } 
        if (!keys) { return null; } 
        if (!objList) { return null; }
        for (const entry0 of objList) {
            const entry = getEntry(entry0);
            const str1 = this.getFirst( entry, keys)
			if (typeof str1 !== "string") { continue; }
			const ret = foundFun(str0, str1);
			if (ret) { return entry0 }
        }
        return null
    }


	hasPrefix(str0: string, str1: string) {
		if (!str1) { return false; }
		if (str0.startsWith(str1)) { return true; }
		if (str1.startsWith(str0)) { return true; }
		return false
	}

	hasSuffix(str0: string, str1: string) {
		if (!str1) { return false; }
		if (str0.endsWith(str1)) { return true; }
		if (str1.endsWith(str0)) { return true; }
		return false
	}

	formatDoi(doi: string): string {
        if (doi == '') { return '' }
        if (!doi.startsWith('https://doi.org/')) {
            return 'https://doi.org/' + doi;
        }
        return doi
    }

	hash64(input: string): string {
		console.log("input");
		console.log(input);
		let hash = 0n; // Use BigInt for 64-bit precision
	
		for (let i = 0; i < input.length; i++) {
			const charCode = BigInt(input.charCodeAt(i));
			hash = (hash << 5n) - hash + charCode; // Simple hash algorithm
			hash &= 0xFFFFFFFFFFFFFFFFn; // Ensure it stays 64-bit
		}
	
		return hash.toString(32).padStart(32, '0'); // Convert to 16-character hex string
	}

}

