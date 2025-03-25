import { TFile } from 'obsidian';
import { basename } from 'path';
import { OBA } from 'src/oba-base/globals';
import { tools } from 'src/tools-base/0-tools-modules';

/*
    Handle the manipulation of note
    - for instance:
        - Create new notes with a given template
        - Extract section to separe notes
*/

export function onload() {
    console.log("ObaNotes:onload");

    OBA.addCommand({
        id: "oba-obanotes-subnote-link",
        name: "ObaNotes subnote link",
        callback: async () => {
            console.clear()
            const link = subNoteLinkFromSelection()
            await tools.copyToClipboard(link)
        },
    });
    
}

export function subNoteLinkFromSelection() {
    const path = tools.getCurrNotePathErr()
    const name0 = basename(path).
        replace(/.md$/, '')
    const sel = tools.getSelectedText().trim();
    let name1 = tools.fixPoint(sel, (stri) => {
        return stri.trim().replace(/[^a-zA-Z0-9\s\-_]/g, '')
    })
    name1 = tools.toCamelCase(name1)
    return `[[sub - ${name1} - ${name0}|${sel}]]`
}

export function readLines(note: TFile) {
    
}