import { Notice, TFile } from "obsidian";
import { obanotes } from "src/onanotes-base/0-obanotes-modules";
import { biblio } from "src/biblio-base/0-biblio-modules";
import { tools } from "src/tools-base/0-tools-modules";
import { basename } from "path";
import { BiblIOData } from "src/biblio-base/biblio-data";

/*
# RefResolverMap
- To be use as a custom setting for reference resolution
- It is intended to be eddited manually in the json file
*/

// MARK: parse
// TODO/TAI: do not rely on the note name
// - Maybe add a citekey field on the yalm section of the note
export function parseCitNoteCiteKey(note: any, {err = false} = {}) {
    const fun = () => {
        const path = tools.resolveNoteAbsPath(note);
        if (!path) { return null; }
        return basename(path).
            replace(/\.md$/, '')?.
            replace(/^@/, '')
    }
    return tools.errVersion({err, fun,
        msg: 'Error parsing citekey'
    })
}

// MARK: get
export async function getCitNoteBiblIO(
    note: TFile = tools.getCurrNote()
) {
    const citekey = parseCitNoteCiteKey(note);
    return await biblio.consensusBiblIO({citekey})
}

export async function getCitNoteReferenceBiblIOs(
    note: TFile = tools.getCurrNote()
) {
    const iders = await consensusCitNoteRefResolverMap(note)
    const biblIOs: BiblIOData[] = []
    // Iterate through all reference numbers from 1 to the total number of keys in the iders object.
    // If a reference number is missing in the iders object, throw an error indicating the missing reference.
    // For each valid reference number found in iders, resolve the corresponding biblIO and add it to the biblIOs array.
    const n = Object.keys(iders).length
    for (let i = 1; i <= n; i++) {
        if (!(i in iders)) {
            const msg = `Reference number ${i} not found in resolver map. Fix it!!`;
            new Notice(msg);
            throw new Error(msg);
        }
        const biblIO = await biblio.consensusBiblIO(iders[i])
        biblIOs.push(biblIO);
    }
    return biblIOs
}

// MARK: RefResolverMap
export interface RefResolverMap {
    [key: number]: any
}

// "citnotes.references.resolver-map"
// load the consensus map for resolving CitNotes biblIO references
export async function consensusCitNoteRefResolverMap(note: TFile) {
    const map0 = await obanotes.getObaNoteConfig(note, "citnotes.references.resolver-map", null)
    const map1 = await newRefResolverMap(note)
    // merge objects
    // User defined map has precedence
    if (map0 && map1) { return {...map1, ...map0} } 
    return map0 || map1
}


export async function newRefResolverMap(note: TFile) {
    const biblIO = await getCitNoteBiblIO(note)
    const map: { [key: number]: any } = {}
    const refDOIs = biblIO["references-DOIs"]
    if (!refDOIs) { return; }
    for (let i = 0; i < refDOIs.length; i++) {
        const ider = await biblio.resolveBiblIOIder({ "doi": refDOIs?.[i] })
        map[i + 1] = ider
    }
    return map;
}