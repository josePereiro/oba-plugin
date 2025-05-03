import { basename } from 'path';
import { addObaCommand } from 'src/oba-base/commands';
import { vscodeGotoFile } from 'src/services-base/vscode';
import { tools } from 'src/tools-base/0-tools-modules';
import { getCurrNote, getCurrNotePath, getSelectedText } from 'src/tools-base/obsidian-tools';
import { obanotes } from './0-obanotes-modules';
import { getNoteConfigPath, getObaNoteConfigJSON } from './noteconfig';

// index
export * from './noteconfig';
export * from './obanotes-base';

/*
    Handle the manipulation of note
    - for instance:
        - Create new notes with a given template
        - Extract section to separe notes
*/

export function onload() {
    console.log("ObaNotes:onload");

    addObaCommand({
        commandName: "add oba-id to all notes",
        serviceName: ["ObaNotes"],
        async commandCallback({ commandID, commandFullName }) {
            console.clear()
            const notes = obanotes.getObaNotes();
            let i = 1;
            const tot = notes.length;
            for (const note of notes) {
                console.log(`doing ${i}/${tot}`);
                console.log("note: ", note.path);
                const obaid = await obanotes.ensureObaNoteID(note, {strict: false})
                console.log("obaid: ", obaid);
                i++;
            }
        },
    })

    addObaCommand({
        commandName: "subnote link",
        serviceName: ["ObaNotes"],
        async commandCallback({ commandID, commandFullName }) {
            console.clear()
            const link = subNoteLinkFromSelection()
            await tools.copyToClipboard(link)
        },
    })

    addObaCommand({
        commandName: "open note config json",
        serviceName: ["ObaNotes"],
        async commandCallback({ commandID, commandFullName }) {
            console.clear()
            const note = getCurrNote({strict: true})
            const path = await getNoteConfigPath(note)
            vscodeGotoFile(path)
        },
    })

    addObaCommand({
        commandName: "log note config",
        serviceName: ["ObaNotes", "Dev"],
        async commandCallback({ commandID, commandFullName }) {
            console.clear()
            const note = getCurrNote({strict: true})
            const config = await getObaNoteConfigJSON(note)
            console.log("config: ", config)
        },
    })

    addObaCommand({
        commandName: "test",
        serviceName: ["ObaNotes", "Dev"],
        async commandCallback({ commandID, commandFullName }) {
            console.clear()
        },
    })
    
}

export function subNoteLinkFromSelection() {
    const path = getCurrNotePath({strict: true})
    const name0 = basename(path).
        replace(/.md$/, '')
    const sel = getSelectedText().trim();
    let name1 = tools.fixPoint(sel, (stri: string) => {
        return stri.trim().replace(/[^a-zA-Z0-9\s\-_]/g, '')
    })
    name1 = tools.toCamelCase(name1)
    return `[[sub - ${name1} - ${name0}|${sel}]]`
}
