import { TFile } from "obsidian";
import { obanotes } from "src/onanotes-base/0-obanotes-modules";
import { biblio } from "src/biblio-base/0-biblio-modules";
import { ErrVersionCallerOptions, tools } from "src/tools-base/0-tools-modules";
import { basename } from "path";
import { BiblIOData } from "src/biblio-base/biblio-data";
import * as _ from 'lodash'
import { consensusReferenceBiblIOs } from "src/biblio-base/biblio-base";
import { getCurrNote, resolveNoteAbsPath } from "src/tools-base/obsidian-tools";

/*
# RefResolverMap
- To be use as a custom setting for reference resolution
- It is intended to be eddited manually in the json file
*/

// MARK: parse
// TODO/TAI: do not rely on the note name
// - Maybe add a citekey field on the yalm section of the note
export function parseCitNoteCiteKey(
    note: any, 
    errops: ErrVersionCallerOptions = {
        strict: false,
        msg: 'Error parsing citekey'
    }
) {
    const fun = () => {
        const path = resolveNoteAbsPath(note);
        if (!path) { return null; }
        return basename(path).
            replace(/\.md$/, '')?.
            replace(/^@/, '')
    }
    return tools.errVersion(fun, errops)
}

// MARK: get
export async function citNoteBiblIO(
    note: TFile = getCurrNote(),
    errops: ErrVersionCallerOptions = {}
) {
    const citekey = parseCitNoteCiteKey(note, errops);
    const biblIO = await biblio.consensusBiblIO({citekey})
    
    // merge reference-map
    await _mergeRefBiblIOIderMap(biblIO, note)
    // merge reference-count
    await _mergeReferencesCount(biblIO, note)
    
    return biblIO
}

async function _mergeReferencesCount(biblIO: BiblIOData, note: TFile) {
    const rcount1 = await obanotes.getObaNoteConfig(note, "citnotes.references.count", null) 
    if (rcount1) { biblIO["references-count"] = rcount1; }
}

async function _mergeRefBiblIOIderMap(biblIO: BiblIOData, note: TFile) {
    const map0 = biblIO["references-map"]
    const map1 = await obanotes.getObaNoteConfig(note, "citnotes.references.resolver-map", null) 
    _.merge(map0, map1) // user defined data has priority
}

export async function citNoteReferenceBiblIOs(
    note: TFile = getCurrNote(),
    errops: ErrVersionCallerOptions = {}
) {
    const biblIO = await citNoteBiblIO(note, errops)
    return await consensusReferenceBiblIOs(biblIO)
}

