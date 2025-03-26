/*
# RefResolverMap
- To be use as a custom setting for reference resolution
- It is intended to be eddited manually in the json file
*/
import { Notice, TFile } from "obsidian";
import { obanotes } from "src/onanotes-base/0-obanotes-modules";
import { getNoteBiblIO } from "./citnotes";
import { biblio } from "src/biblio-base/0-biblio-modules";


// MARK: RefResolverMap
export async function newRefResolverMap(note: TFile) {
    const biblIO = await getNoteBiblIO(note)
    const map: { [key: number]: any } = {}
    const refDOIs = biblIO["references-DOIs"]
    if (!refDOIs) { return; }
    for (let i = 0; i < refDOIs.length; i++) {
        const ider = await biblio.resolveBiblIOIder({ "doi": refDOIs?.[i] })
        map[i + 1] = ider
    }
    return map;
}


// "citnotes.references.resolver-map"
// load config one or build a from biblIO
export function getCitNoteRefResolverMap(note: TFile) {
    const map = obanotes.getObaNoteConfig(note, "citnotes.references.resolver-map", null)
    if (map) { return map }
    return newRefResolverMap(note)
}