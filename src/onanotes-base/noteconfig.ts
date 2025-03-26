import { tools } from "src/tools-base/0-tools-modules";
import { TFile, Vault } from "obsidian";
import { OBA } from "src/oba-base/globals";

// MARK: note config
export function getNoteConfigPath(note: any): string {
    const path = tools.resolveNoteAbsPath(note)
    const h = tools.hash64(path)
    // pathpreview.hash.json
}

function getNoteShortName() {
    
}