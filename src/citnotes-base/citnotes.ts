import { Notice, TFile } from 'obsidian';
import { biblio, crossref, localbibs } from 'src/biblio-base/0-biblio-modules';
import { BiblIOData, BiblIOIder } from 'src/biblio-base/biblio-data';
import { OBA } from 'src/oba-base/globals';
import { tools } from 'src/tools-base/0-tools-modules';
import { consensusReferences } from 'src/biblio-base/biblio';
import { basename } from 'node:path';
import { consensusCitNoteRefResolverMap, getCitNoteReferenceBiblIOs, newRefResolverMap } from './citnotes-base';
import { obanotes } from 'src/onanotes-base/0-obanotes-modules';
export * from './citnotes-base'

/*
    Handle citation notes.
    - parse metadata from citation notes
        - keep a cache of such metadata
    - Notify when format is invalid
    - Replacements (DONE)
        - Replace #!REF13 by the citekey if it is present in the bibtex db
            - Use crossref for getting References
    - TODO: create a per note metadata cache
        - For instance, I should be able to link reference numbers with biblIO data
        - Make a open note config .json in vscode
*/

// MARK: constructor
export function onload() {
    console.log("CitNotes:onload");


    OBA.addCommand({
        id: "CitNotes-dev",
        name: "CitNotes dev",
    });
    
    OBA.addCommand({
        id: "CitNotes-copy-reference-link-from-list",
        name: "CitNotes copy reference link from list",
        callback: async () => {
            console.clear();
            const note0 = tools.getCurrNote();
            console.log("note0: ", note0);
            const biblIOs = await consensusReferences({"citnote": note0});
            if (!biblIOs) {
                new Notice(`No references found. note0: ${note0}`);
                return;
            }
            const references = getCitationStringToSearch(biblIOs);
            if (!references || references.length === 0) {
                new Notice(`No references found. citekey: ${note0}`);
                return;
            }
            const modal = new tools.SelectorModalV2(
                references, 
                "Select reference to copy link",
                async (refnum: number) => {
                    if (refnum == -1) { return; }
                    console.clear();
                    console.log("refnum: ", refnum+1);
                    await copyReferenceLink(note0, [refnum+1]);
                }
            );
            modal.open()
        },
    });

    // OBA.addCommand({
    //     id: 'oba-CitNotes-copy-reference-selected-doi',
    //     name: 'CitNotes copy references of selected doi',
    //     callback: async () => {
    //         console.clear();
    //         const doi0 = tools.getSelectedText()
    //         if (!doi0) {
    //             new Notice('Select a doi');
    //             return;
    //         }
    //         const doi = tools.absDoi(doi0);
    //         await this.copyDoiReferences(doi);
    //     }
    // });
    
    OBA.addCommand({
        id: 'oba-citnotes-copy-reference-current-note',
        name: 'CitNotes copy references of current note',
        callback: async () => {
            console.clear();
            const citnote = tools.getCurrNote()
            await this.copyDoiReferences({citnote});
        }
    });

    OBA.addCommand({
        id: 'oba-citnotes-generate-references-resolver-map',
        name: 'CitNotes generate references resolver map',
        callback: async () => {
            console.clear();
            const citnote = tools.getCurrNote()
            await generateConfigRefResolverMap(citnote)
        }
    });

    OBA.addCommand({
        id: 'oba-citnotes-copy-non-local-reference-current-note',
        name: 'CitNotes copy non-local references of current note',
        callback: async () => {
            console.clear();
            const note = tools.getCurrNote()
            const citekey = parseCitNoteCiteKey(note, {err: true})
            await copyNonLocalReferences({citekey});
        }
    });
    
    OBA.addCommand({
        id: "oba-citnotes-copy-link-selected-reference-number",
        name: "CitNotes copy link of selected reference number",
        callback: async () => {
            console.clear();
            // const str = tools.getSelectedText().
                // replace(/\D+/g, "")
            const str = tools.getSelectedText()
            const refnums = extractRefNums(str);
            const note = tools.getCurrNote()
            await copyReferenceLink(note, refnums)
        }
    });

    OBA.addCommand({
        id: "oba-citnotes-download-all-local-notes",
        name: "CitNotes download all local notes",
        callback: async () => {
            console.clear();
            await downloadAllLocalReferences()
        }
    });

}

// TODO/
// - Use RefResolverMap for all Reference related methods
// - Use regex in the RefResolverMap keys
// - First resolve Iders and them retrive biblIOs
// - Add a general biblIO search interface
//  - Change BiblIOIder to BiblIOQuery
//      - or just use a incomplete BiblIOData object

// "citnotes.references.resolver-map"
export async function generateConfigRefResolverMap(note: TFile) {
    const config = await obanotes.getObaNoteConfigJSON(note) || {}
    const lock = config?.["citnotes.references.resolver-map.lock"]
    if (lock) { 
        new Notice("🚨 ERROR: Map is locked!!")
        return; 
    }
    const map = newRefResolverMap(note)
    config["citnotes.references.resolver-map.lock"] = true
    config["citnotes.references.resolver-map"] = map
    await obanotes.writeObaNoteConfig(note, config)
}

// MARK: copy
export async function copyDoiReferences(id0: BiblIOIder) {

    // get biblio data
    const biblIO_0 = await biblio.consensusBiblIO(id0);
    const refDOIs = biblIO_0["references-DOIs"];
    if (!refDOIs) { return; }

    // collect
    const refStrs: string[] = []
    let refi = 0
    for (const doi1 of refDOIs) {
        const biblIO = await biblio.consensusBiblIO({doi: doi1})

        const citekey = biblIO?.["citekey"]
        const year = biblIO?.["published-date"]?.["year"];
        const title = biblIO?.["title"]
        const author = biblIO?.["authors"]?.[0]?.["lastName"]
        
        let str = ''
        str += `> [${refi + 1}]  `;
        if (citekey) { str += `[[@${citekey}]] `; }
        if (year) { str += `(${year}) `; }
        if (author) { str += `${author}: `; }
        if (title) { str += `"${title}" `; }
        if (doi1) { str += `${doi1} `; }

        refi += 1;

        
        refStrs.push(str)
    } 
    const reference_section = refStrs.join('\n\n');
    await tools.copyToClipboard(reference_section);

    new Notice(`SUCESS!!! Reference copied to clipboard.\ndoi: ${id0["doi"]}`)
}

async function copyNonLocalReferences(id0: BiblIOIder) {

    // get biblio data
    const biblIO_0 = await biblio.consensusBiblIO(id0);
    const refDOIs = biblIO_0["references-DOIs"];
    if (!refDOIs) { return; }

    // get biblio data

    // collect
    const nonLocalDOIs: string[] = []
    for (const doi1 of refDOIs) {
        if (!doi1) { continue; }
        const lb_entry = await localbibs.findByDoi(doi1)
        if (lb_entry) { continue; }
        nonLocalDOIs.push(doi1);
    }

    const reference_section = nonLocalDOIs.join('\n');
    await tools.copyToClipboard(reference_section);

    new Notice(`SUCESS!!! DOIs copied to clipboard`)
}



export async function copyReferenceLink(
    note: TFile, refnums: number[]
) {

    // get biblio data
    const biblIOs = await getCitNoteReferenceBiblIOs(note)
    console.log("biblIOs: ", biblIOs)
    return;
    const biblIO_0 = await biblio.consensusBiblIO({"citnote": note});
    const refDOIs = biblIO_0["references-DOIs"];
    if (!refDOIs) { return; }
    const links: string[] = []

    for (const refnum of refnums) {
        // resolve refDOI
        let refIder: BiblIOIder = null
        // -- look at refResolverMap
        refIder = refResolverMap?.[refnum];
        // -- look at references-DOIs
        if (!refIder) {
            refIder = {"doi": refDOIs?.[refnum - 1]}
        }
        console.log("refIder: ", refIder)

        // create link
        let link = '';
        while (1) {
            if (!refIder) { 
                link = `${refnum}`
                break;
            }
            const biblIO_1 = await biblio.consensusBiblIO(refIder);
            console.log("biblIO_1: ", biblIO_1)
            if (!biblIO_1) { 
                link = `[${refnum}]`
                break;
            }
            const refCitekey = biblIO_1?.["citekey"]
            const refDOI = biblIO_1?.["doi"]
            if (refCitekey) {
                link = `[[@${refCitekey}|${refnum}]]`
            } else if (refDOI) {
                // new Notice(`🚨 ERROR: Missing citekey, doi ${refDOI}`)
                link = `[${refnum}](${refDOI})`
            } else {
                link = `[${refnum}]`
            }
            break;
        }
        links.push(link)
    }
    await tools.copyToClipboard(""); // clear clipboard
    let tocopy = links.join(', ');
    tocopy = `\\[${tocopy}\\]`
    await tools.copyToClipboard(tocopy);
    new Notice(`Link copied in clipboard, link: ${tocopy}`);
}

// MARK: download all
export async function downloadAllLocalReferences() {
    const biblIODB = await localbibs.getMergedBiblIO();
    let i = 0;
    const tot = biblIODB.length;
    for (const biblIO of biblIODB) {
        const doi = biblIO["doi"];
        console.log(`doing: ${i + 1}/${tot}`);
        await crossref.fetchOnDemandCrossrefData(doi);
        i++;
    }
}

// MARK: utils
function extractRefNums(str: string): number[] {
    // Extract all numeric sequences from the input string
    const matches = str.match(/\d+/g);
    if (!matches) { return []; }
    // Convert the numeric sequences to integers and return them
    return matches.map(num => parseInt(num, 10));
}

function getCitationStringToSearch(biblIOs: BiblIOData[]) {
    const MAX_AUTHORS = 5;
    return biblIOs.map(biblIO => {
        let authors = biblIO?.["authors"]?.map(author => author?.["lastName"]) || ["Unknown Author"];
        if (authors.length > MAX_AUTHORS) {
            authors = authors.slice(0, MAX_AUTHORS).concat(["et al."]);
        }
        const authorsStr = authors.join(", ");
        const title = biblIO?.["title"] || "Untitled";
        const citekey = biblIO?.["citekey"] ? `[@${biblIO["citekey"]}]` : "[No Citekey]";
        const year = biblIO?.["published-date"]?.["year"] || "Unknown Year";
        return `${authorsStr} (${year}). "${title}" ${citekey}`;
    });
}

