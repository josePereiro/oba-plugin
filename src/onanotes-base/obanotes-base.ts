import { v4 as uuidv4 } from 'uuid';
import { obaconfig, filesys } from "src/oba-base/0-oba-modules";
import { ErrVersionCallerOptions, tools } from "src/tools-base/0-tools-modules";
import { basename } from 'path';
import { OBA } from 'src/oba-base/globals';
import { absPath, modifyNoteYamlHeader, resolveNoteAbsPath } from 'src/tools-base/obsidian-tools';

// MARK: FileSys
export function getObaNotesDir(): string {
    const path = obaconfig.getObaConfig("obanotes.configs.folder", null)
    if (path) { return absPath(path); }
    return filesys.getObaDir("obanotes")
}

export function genObaNoteId(): string {
    return uuidv4()
}

export function getShortName(note: any, len = 40): string {
    const path = resolveNoteAbsPath(note)
    const name = basename(path)
        .replace(".md", "")
        .replace(/[^a-zA-Z0-9]/g, '_')
    return name.slice(0, len)
}

export async function ensureObaNoteID(
    note: any, 
    errops: ErrVersionCallerOptions = {
        strict: false,
        msg: "NoteID missing"
    }
) {
    const fun = async () => {
        const yaml = await modifyNoteYamlHeader(note, (yaml) => {
            const id = yaml?.["oba-id"]
            if (id) { return }
            yaml["oba-id"] = genObaNoteId()
        })
        return yaml?.["oba-id"]
    }
    return await tools.errVersion(fun, errops)
}

// "obanotes.include.folders": ["2_notes"],
export function getObaNotes() {
    const folders: string[] = obaconfig.getObaConfig("obanotes.include.folders", [''])
    const notes = OBA.app.vault.getMarkdownFiles()
    return notes.filter((note) => {
        return folders.some(folder => note.path.includes(folder))
    })
}