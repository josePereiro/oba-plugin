import { EditorPosition, FileSystemAdapter, MarkdownView, Notice, TFile } from "obsidian";
import { join } from "path";
import { OBA } from "src/oba-base/globals";
import { isAbsolute } from "path";
import { ErrVersionCallerOptions, tools } from "./0-tools-modules";

export function getCurrNote(
    errops: ErrVersionCallerOptions = {
        strict: false,
        msg: "No active file"
    }
): TFile | null  {
    const fun = () => {
        return OBA.app.workspace.getActiveFile();
    }
    return tools.errVersion(fun, errops)
}
export function getCurrNotePath(
    errops: ErrVersionCallerOptions = {
        strict: false,
        msg: "No active file"
    }
): string | null  {
    const fun = () => {
        const note = getCurrNote();
        return resolveNoteAbsPath(note)
    }
    return tools.errVersion(fun, errops)
}

export function getVaultDir(
    errops: ErrVersionCallerOptions = {
        strict: false,
        msg: "Cannot determine base path."
    }
): string {
    // base path
    const fun = () => {
        if (OBA.app.vault.adapter instanceof FileSystemAdapter) {
            return OBA.app.vault.adapter.getBasePath();
        } else { return null; }
    }
    return tools.errVersion(fun, errops)
}

export function getSelectedText(
    errops: ErrVersionCallerOptions = {
        strict: false,
        msg: 'No text selected.'
    }
) : string | null{
    const fun = () => {
        const editor = OBA.app.workspace.activeEditor?.editor;
        if (!editor) { return null }
        const selectedText = editor.getSelection();
        console.log("selectedText:\n ", selectedText);
        return selectedText ? selectedText : null
    }
    return tools.errVersion(fun, errops)
}

export function getSelectionRange(
    errops: ErrVersionCallerOptions = {
        strict: false,
        msg: 'No text selected.'
    }
): { start: number, end: number } | null{
    const fun = () => {
        const editor = OBA.app.workspace.activeEditor?.editor;
        if (!editor) { return null }
        const selection = editor.getSelection();
        if (!selection) { return null }
        const start = editor.posToOffset(editor.getCursor('from'));
        const end = editor.posToOffset(editor.getCursor('to'));
        return { start, end };
    }
    return tools.errVersion(fun, errops)
}

export function getCursorPosition(
    errops: ErrVersionCallerOptions = {
        strict: false,
        msg: 'No active file.'
    }
): { line: number, ch: number } | null {
    const fun = () => {
        const editor = OBA.app.workspace.activeEditor?.editor;
        if (!editor) { return null }
        return editor.getCursor();
    }
    return tools.errVersion(fun, errops)
}

export function insertAtCursor(
    txt: string, 
    errops: ErrVersionCallerOptions = {
        strict: true,
        msg: 'No active file.'
    }
): number {
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
    return tools.errVersion(fun, errops)
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

export function absPath(
    path: string, 
    errops: ErrVersionCallerOptions = {strict: false}
): string | null {
    if (isAbsolute(path)) { return path; } 
    return join(getVaultDir(errops), path);
}

export function resolveNoteAbsPath(
    note: string | TFile | null, 
    errops: ErrVersionCallerOptions = {
        strict: false,
        msg: 'Null note.'
    }
): string | null {
    const fun = () => {
        if (!note) { return null; }
        if (typeof note === 'string') {
            return absPath(note)
        } else {
            return absPath(note.path)
        }
    }
    return tools.errVersion(fun, errops)
}

// MARK: yaml section
export async function modifyNoteYamlHeader(
    note: TFile, 
    mod0: (frontmatter: any) => void
): Promise<any> {
    let ret = null;
    const mod1 = (frontmatter: any) => {
        ret = frontmatter
        mod0(frontmatter)
    }
    await OBA.app.fileManager.processFrontMatter(note, mod1);
    return ret;
}

export function getNoteYamlHeader(note: TFile): any | null {
    // Get the active file's frontmatter
    if (!note) { return null }
    const fileCache = OBA.app.metadataCache.getFileCache(note);
    const frontmatter = fileCache?.frontmatter;
    if (!frontmatter) { return null }
    return frontmatter
}

export function getNoteYamlHeaderVal(
    note: TFile, 
    key: string, 
    dflt: any = null,
    errops: ErrVersionCallerOptions = {
        strict: false,
        msg: 'No frontmatter.'
    }
): any | null {
    const fun = () => {
        const yaml = getNoteYamlHeader(note);
        return yaml?.[key] || dflt
    }
    return tools.errVersion(fun, errops)
}

export async function processNoteByLines(
    note: TFile,
    processor: (line: string) => string
) {
    await OBA.app.vault.process(note, (content) => {
        return replaceByLines(content, processor)
    })
}

export function replaceByLines(
    txt: string, 
    processor: (line: string) => string
) {
    const lines: string[] = txt.split('\n')
    const nlines = lines.length
    for (let li = 0; li < nlines; li++) {
        lines[li] = processor(lines[li])
    }
    return lines.join('\n')
}