import { EditorPosition, FileSystemAdapter, MarkdownView, Notice, TFile } from "obsidian";
import { join } from "path";
import { OBA } from "src/oba-base/globals";
import { isAbsolute } from "path";
import { tools } from "./0-tools-modules";

export function getCurrNote(): TFile | null  {
    return OBA.app.workspace.getActiveFile();
}
export function getCurrNotePath({err = false} = {}): string | null  {
    const fun = () => {
        const note = getCurrNote();
        return resolveNoteAbsPath(note)
    }
    return tools.errVersion({err, fun, msg: "No active file"})
}

export function getVaultDir({err = false} = {}): string {
    // base path
    const fun = () => {
        if (OBA.app.vault.adapter instanceof FileSystemAdapter) {
            return OBA.app.vault.adapter.getBasePath();
        } else { return null; }
    }
    return tools.errVersion({err, fun, 
        msg: 'Cannot determine base path.'
    })
}

export function getSelectedText({err = false} = {}) : string | null{
    const fun = () => {
        const editor = OBA.app.workspace.activeEditor?.editor;
        if (!editor) { return null }
        const selectedText = editor.getSelection();
        console.log("selectedText:\n ", selectedText);
        return selectedText ? selectedText : null
    }
    return tools.errVersion({err, fun, 
        msg: 'No text selected.'
    })
}

export function getSelectionRange({err = false} = {}): { start: number, end: number } | null{
    const fun = () => {
        const editor = OBA.app.workspace.activeEditor?.editor;
        if (!editor) { return null }
        const selection = editor.getSelection();
        if (!selection) { return null }
        const start = editor.posToOffset(editor.getCursor('from'));
        const end = editor.posToOffset(editor.getCursor('to'));
        return { start, end };
    }
    return tools.errVersion({err, fun, 
        msg: 'No text selected.'
    })
}

export function getCursorPosition({err = false} = {}): { line: number, ch: number } | null {
    const fun = () => {
        const editor = OBA.app.workspace.activeEditor?.editor;
        if (!editor) { return null }
        return editor.getCursor();
    }
    return tools.errVersion({err, fun, 
        msg: 'No active file.'
    })
}

export function insertAtCursor(txt: string, {err = true} = {}): number {
    const fun = () => {
        const view = OBA.app.workspace.getActiveViewOfType(MarkdownView);
        if (!view) {
            new Notice('No active file.');
            return 0;
        }
        const cursor: EditorPosition = view.editor.getCursor()
        view.editor.replaceRange(txt, cursor);
        return 1;
    }
    return tools.errVersion({err, fun, 
        msg: 'No active file.'
    })
}

export function getTagsForFile(file: TFile): string[] | null {
    const metadata = OBA.app.metadataCache.getFileCache(file);
    if (metadata && metadata.tags) {
        return metadata.tags.map((tag) => tag.tag);
    }
    return null;
}

export function getTags(file: TFile) {
    const metadata = OBA.app.metadataCache.getFileCache(file);
    return metadata?.tags
}

export function hasTag(file: TFile, tag0: string) {
    const tags = getTags(file);
    return tags?.some((tag: { tag: string; }) => tag.tag === tag0);
}

export function linkToNotePath(noteName: string) {
    const path = OBA.app.metadataCache.getFirstLinkpathDest(noteName, '')
    return resolveNoteAbsPath(path);
}

export async function openNoteAtLine(
    filePath: string,
    lineNumber: number
): Promise<void> {
    // Get the file from the vault
    const file = OBA.app.vault.getAbstractFileByPath(filePath);
    
    if (!(file instanceof TFile)) {
        console.error(`File not found: ${filePath}`);
        return;
    }

    // Open the file in a new leaf or reuse existing one
    const leaf = OBA.app.workspace.getLeaf(false);
    await leaf.openFile(file);
    
    // Wait for the editor to be ready
    const view = leaf.view;
    if (view?.getViewType() === 'markdown') {
        // Get the editor instance
        // @ts-ignore - accessing private API
        const editor = view.editor;
        
        if (editor) {
            // Scroll to the line (convert to 0-based index)
            const lineIndex = Math.max(0, lineNumber - 1);
            editor.setCursor({ line: lineIndex, ch: 0 });
            editor.scrollIntoView({
                from: { line: lineIndex, ch: 0 },
                to: { line: lineIndex, ch: 0 }
            }, true);
        }
    }
}

export function absPath(path: string, {err = false} = {}): string | null {
    if (isAbsolute(path)) { return path; } 
    return join(getVaultDir({err}), path);
}

export function resolveNoteAbsPath(
        note: string | TFile | null, 
        {err = false} = {}
    ): string | null {
    const fun = () => {
        if (!note) { return null; }
        if (typeof note === 'string') {
            return absPath(note)
        } else {
            absPath(note.path)
        }
    }
    return tools.errVersion({err, fun,
        msg: 'Null note.'
    })
}