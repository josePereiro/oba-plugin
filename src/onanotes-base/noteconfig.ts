import { JsonIO } from "src/tools-base/0-tools-modules";
import { ensureObaNoteID, getObaNotesDir } from "./obanotes-base";
import { join } from "path";
import { existsSync } from "fs";
import { TFile } from "obsidian";


// MARK: note config
export async function getNoteConfigPath(note: any) {
    const uuid = await ensureObaNoteID(note)
    const dir = getObaNotesDir()
    return join(dir, `${uuid}.config.json`)
}

export async function getObaNoteConfigJsonIO(note: TFile) {
    const io = new JsonIO()
    const configpath = await getNoteConfigPath(note)
    io.file(configpath)
    if (existsSync(configpath)) { io.load() }
    return io
}

export async function getObaNoteConfigJSON(note: any) {
    const io = await getObaNoteConfigJsonIO(note)
    return io.retDepot()
}

export async function writeObaNoteConfig(note: any, config: any) {
    const io = await getObaNoteConfigJsonIO(note)
    return io.write()
}

// read a key in the config file
export async function getObaNoteConfig(note: any, key: string, dflt: any = null) {
    const io = await getObaNoteConfigJsonIO(note)
    return io.getd(key, dflt).retVal()
}

export async function setObaNoteConfig(note: any, key: string, val: any) {
    const io = await getObaNoteConfigJsonIO(note)
    return io.set(key, val)
}

export async function getSetObaNoteConfig(note: any, key: string, val: any = null) {
    const io = await getObaNoteConfigJsonIO(note)
    return io.getset(key, val).retVal()
}
