import { filesys } from "src/oba-base/0-oba-modules";
import { tools } from "src/tools-base/0-tools-modules";

// MARK: FileSys
export function getObaNotesDir(): string {
    return filesys.getObaDir("obanotes")
}

// MARK: note config
export function getNoteConfigPath(note: string): string {
    const h = tools.hash64(note)
    return filesys.join(getObaNotesDir(), note, "config.json")
}

