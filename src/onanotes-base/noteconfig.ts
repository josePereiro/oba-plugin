import { tools } from "src/tools-base/0-tools-modules";
import { ensureObaNoteID, getObaNotesDir } from "./obanotes-base";
import { join } from "path";

// MARK: note config
export async function getNoteConfigPath(note: any) {
    const uuid = await ensureObaNoteID(note)
    const dir = getObaNotesDir()
    return join(dir, `${uuid}.config.json`)
}


export async function getObaNoteConfigJSON(note: any) {
    const configpath = await getNoteConfigPath(note)
    return tools.loadJsonFileSync(configpath)
}

export async function writeObaNoteConfig(note: any, config: any) {
    const configpath = await getNoteConfigPath(note)
    return await tools.writeJsonFileAsync(configpath, config)
}

// read a key in the config file
export async function getObaNoteConfig(note: any, key: string, dflt: any = null) {
    try {
        const config = await getObaNoteConfigJSON(note)
        if (!(key in config)) { 
            console.warn(`Unknown key, key: `, key)
            return dflt
        } else {
            return config[key]
        }
    } catch (err) {
        console.warn("Error getting config", err);
        return dflt
    }
}

export async function setObaNoteConfig(note: any, key: string, val: any) {
    const config = await getObaNoteConfigJSON(note) || {}
    config[key] = val
    await writeObaNoteConfig(note, config)
}

export async function getSetObaNoteConfig(note: any, key: string, dflt: any = null) {
    let config: { [key: string]: any } = {};
    try {
        config = await getObaNoteConfigJSON(note) || config
        if (!(key in config)) { 
            console.warn(`Unknown key, key: `, key)
            config[key] = dflt
            await writeObaNoteConfig(note, config)
            return dflt
        } else {
            return config[key]
        }
    } catch (err) {
        console.warn("Error getting config", err);
        config[key] = dflt
        await writeObaNoteConfig(note, config)
        return dflt
    }
}
