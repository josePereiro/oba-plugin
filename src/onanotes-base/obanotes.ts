import { TFile } from 'obsidian';
import { basename } from 'path';
import { OBA } from 'src/oba-base/globals';
import { tools } from 'src/tools-base/0-tools-modules';
import { obanotes } from './0-obanotes-modules';
import { vscode } from 'src/services-base/0-servises-modules';
import { getNoteConfigPath, getObaNoteConfigJSON, getSetObaNoteConfig } from './noteconfig';
import { genObaNoteId } from './obanotes-base';

// index
export * from './obanotes-base'
export * from './noteconfig'

/*
    Handle the manipulation of note
    - for instance:
        - Create new notes with a given template
        - Extract section to separe notes
*/

export function onload() {
    console.log("ObaNotes:onload");

    OBA.addCommand({
        id: "oba-obanotes-add-ob.id-to-all",
        name: "ObaNotes add oba.id to all",
        callback: async () => {
            console.clear()
            const notes = obanotes.getObaNotes();
            let i = 1;
            const tot = notes.length;
            for (const note of notes) {
                console.log(`doing ${i}/${tot}`);
                console.log("note: ", note.path);
                const obaid = await obanotes.ensureObaNoteID(note, {err: false})
                console.log("obaid: ", obaid);
                i++;
            }
        },
    });

    OBA.addCommand({
        id: "oba-obanotes-subnote-link",
        name: "ObaNotes subnote link",
        callback: async () => {
            console.clear()
            const link = subNoteLinkFromSelection()
            await tools.copyToClipboard(link)
        },
    });

    OBA.addCommand({
        id: "oba-obanotes-open-note-config-json",
        name: "ObaNotes open note config json",
        callback: async () => {
            console.clear()
            const note = tools.getCurrNote({err: true})
            const path = await getNoteConfigPath(note)
            vscode.goto(path)
        },
    });

    OBA.addCommand({
        id: "oba-obanotes-log-note-config",
        name: "ObaNotes log note config",
        callback: async () => {
            console.clear()
            const note = tools.getCurrNote({err: true})
            const config = await getObaNoteConfigJSON(note)
            console.log("config: ", config)
        },
    });

    OBA.addCommand({
        id: "oba-obanotes-dev",
        name: "ObaNotes dev",
        callback: async () => {
            console.clear()
            const note = tools.getCurrNote({err: true})
            const config = await getSetObaNoteConfig(note, "oba.test", genObaNoteId())
            console.log("config: ", config)
        },
    });
    
}

export function subNoteLinkFromSelection() {
    const path = tools.getCurrNotePath({err: true})
    const name0 = basename(path).
        replace(/.md$/, '')
    const sel = tools.getSelectedText().trim();
    let name1 = tools.fixPoint(sel, (stri: string) => {
        return stri.trim().replace(/[^a-zA-Z0-9\s\-_]/g, '')
    })
    name1 = tools.toCamelCase(name1)
    return `[[sub - ${name1} - ${name0}|${sel}]]`
}
