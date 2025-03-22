import { existsSync, mkdirSync } from "fs";
import { EditorPosition, FileSystemAdapter, MarkdownView, Notice, TFile } from "obsidian";
import { join } from "path";
import { OBA } from "src/0-base/globals";

export function getCurrNote(): TFile | null  {
    return OBA.app.workspace.getActiveFile();
}
export function getCurrNotePath(): string | null  {
    const path = getCurrNote()?.path;
    if (!path) { return null; }
    return join(
        getVaultDir(),
        path
    )
}
export function getCurrNotePathErr(): string  {
    const path = getCurrNote()?.path;
    if (!path) { throw {msg: "No active file"}; }
    return join( getVaultDir(), path )
}

export function getVaultDir(): string {
    let path;
    // base path
    if (OBA.app.vault.adapter instanceof FileSystemAdapter) {
        path = OBA.app.vault.adapter.getBasePath();
    } else {
        throw new Error('Cannot determine base path.');
    }
    return path;
}

export function getObaDir(): string {
    const vault = getVaultDir();
    const obaDir = join(vault, ".Oba");
    if (!existsSync(obaDir)) {
        mkdirSync(obaDir, { recursive: true });
    }
    return obaDir;
}

export function getSelectedText() : string {
    const editor = OBA.app.workspace.activeEditor?.editor;
    if (!editor) { return '' }
    const selectedText = editor.getSelection();
    console.log("selectedText:\n ", selectedText);
    return selectedText ? selectedText : ''
}

export function getSelectionRange(): { start: number, end: number } {
    const editor = OBA.app.workspace.activeEditor?.editor;
    if (!editor) { return {start: -1, end: -1} }
    const selection = editor.getSelection();
    if (!selection) { return {start: -1, end: -1} }
    const start = editor.posToOffset(editor.getCursor('from'));
    const end = editor.posToOffset(editor.getCursor('to'));
    return { start, end };
}

export function getCursorPosition(): { line: number, ch: number } {
    const editor = OBA.app.workspace.activeEditor?.editor;
    if (!editor) { return {line: -1, ch: -1} }
    // Get the cursor's position in { line, ch } format
    return editor.getCursor();
}

export function insertAtCursor(txt: string) {
    const view = OBA.app.workspace.getActiveViewOfType(MarkdownView);
    if (!view) {
        new Notice("No note opened.");
        return;
    }
    const cursor: EditorPosition = view.editor.getCursor()
    view.editor.replaceRange(txt, cursor);
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
    // console.log("tags: ", metadata?.tags)
    return tags?.some((tag: { tag: string; }) => tag.tag === tag0);
}

export function getNotePath(noteName: string) {
    OBA.app.metadataCache.getFirstLinkpathDest(noteName, '')
}
