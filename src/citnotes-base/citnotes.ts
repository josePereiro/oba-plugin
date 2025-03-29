import { Notice, TFile } from 'obsidian';
import { biblio, crossref, localbibs } from 'src/biblio-base/0-biblio-modules';
import { BiblIOData, BiblIOIder } from 'src/biblio-base/biblio-data';
import { OBA } from 'src/oba-base/globals';
import { tools } from 'src/tools-base/0-tools-modules';
import { obanotes } from 'src/onanotes-base/0-obanotes-modules';
import { citNoteBiblIO, citNoteReferenceBiblIOs, parseCitNoteCiteKey } from './citnotes-base';
import { statusbar } from 'src/services-base/0-servises-modules';
export * from './citnotes-base'

/*
    Handle citation notes.
    - DONE/ parse metadata from citation notes
        - TAI/ keep a cache of such metadata
    - TODO/ Notify when format is invalid (linter)
    - DONE/ Replacements        
        - DEPRECATED/ Replace #!REF13 by the citekey if it is present in the bibtex db
            - DONE/ Use crossref for getting References
    - DONE/ create a per note metadata cache
        - For instance, I should be able to link reference numbers with biblIO data
        - Make a open note config .json in vscode
*/

// MARK: constructor
export function onload() {
    console.log("CitNotes:onload");


    OBA.addCommand({
        id: "CitNotes-dev",
        name: "CitNotes dev",
        callback: async () => {
            console.clear();
            const note0 = tools.getCurrNote();
            console.log("note0: ", note0);
            const citekey = parseCitNoteCiteKey(note0)
            console.log("citekey: ", citekey);
            const biblIO1 = await localbibs.getBiblIO({citekey});
            console.log("localbibs: ", biblIO1);
            const doi = biblIO1["doi"]
            console.log("doi: ", doi);
            const biblIO2 = await crossref.getBiblIO({doi});
            console.log("crossref: ", biblIO2);
            const biblIO3 = await citNoteBiblIO(note0);
            console.log("citnote: ", biblIO3);
        }
    });
    
    OBA.addCommand({
        id: "CitNotes-copy-selected-reference-link-from-list",
        name: "CitNotes copy selected reference link from list",
        callback: async () => {
            console.clear();

            // copy selection
            const sel0 = tools.getSelectedText()
            await tools.copyToClipboard(sel0)
            const note0 = tools.getCurrNote();
            await copySelectedCitNoteReferenceLinkFromList(note0, sel0)
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
    //         await this.copyCitNoteReferencesSection(doi);
    //     }
    // });
    
    OBA.addCommand({
        id: 'oba-citnotes-copy-reference-current-note',
        name: 'CitNotes copy references of current note',
        callback: async () => {
            console.clear();
            const note = tools.getCurrNote()
            await this.copyCitNoteReferencesSection(note);
        }
    });

    OBA.addCommand({
        id: 'oba-citnotes-generate-references-resolver-map',
        name: 'CitNotes generate references resolver map',
        callback: async () => {
            console.clear();
            const citnote = tools.getCurrNote()
            await generateCitNoteConfigRefResolverMap(citnote)
        }
    });

    OBA.addCommand({
        id: 'oba-citnotes-copy-non-local-reference-current-note',
        name: 'CitNotes copy non-local references of current note',
        callback: async () => {
            console.clear();
            const note = tools.getCurrNote()
            await copyCitNoteNonLocalReferences(note);
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
            await copyCitNoteReferenceLink(note, refnums)
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
// - DONE/ Use RefResolverMap for all Reference related methods
// - TODO/ Use regex in the RefResolverMap keys
// - TODO/First resolve Iders and them retrive biblIOs
// - TODO/Add a general biblIO search interface
//  - Change BiblIOIder to BiblIOQuery
//      - or just use a incomplete BiblIOData object

// MARK: copy
async function copySelectedCitNoteReferenceLinkFromList(
    note0: TFile,
    sel0 = ''
) {
    // select from list
    console.log("note0: ", note0);
    const refBiblIOs = await citNoteReferenceBiblIOs(note0);
    if (!refBiblIOs) {
        new Notice(`No references found. note0: ${note0}`);
        return;
    }
    const references = getCitationStringToSearch(refBiblIOs);
    if (!references || references.length === 0) {
        new Notice(`No references found. citekey: ${note0}`);
        return;
    }
    
    const query = !sel0 ? '' : sel0.trim()
          .replace(/[^a-zA-Z0-9\s]/g, '')
          .replace(/ et\.? al\.?,?;?/g, ' ')

    const modal = new tools.SelectorModalV2(
        references, 
        "Select reference to copy link",
        query,
        async (refnum: number) => {
            if (refnum == -1) { return; }
            console.clear();
            console.log("refnum: ", refnum+1);
            const refbiblIO = refBiblIOs?.[refnum]
            if (!refbiblIO) { return; }
            const label = sel0 ? `${sel0} \\[${refnum + 1}\\]` : `\\[${refnum + 1}\\]`
            const link = _generateReferenceLink(refbiblIO, label)
            await tools.copyToClipboard(link)
            new Notice(`Link copied. link: ${link}`);
        }
    );
    modal.open()
}


export async function generateCitNoteConfigRefResolverMap(
    note: TFile
) {
    const config = await obanotes.getObaNoteConfigJSON(note) || {}
    console.log("note.config: ", config)
    const lock = config?.["citnotes.references.resolver-map.lock"]
    if (lock) { 
        new Notice("🚨 ERROR: Map is locked!!")
        return; 
    }
    const map0 = config?.["citnotes.references.resolver-map"]
    if (map0) {
        new Notice("🚨 ERROR: Map exist, deleted for overwriting!!")
        return; 
    }
    const biblIO = await citNoteBiblIO(note)
    const map1 = biblIO["references-map"]
    console.log("map1: ", map1)
    config["citnotes.references.resolver-map.lock"] = true
    config["citnotes.references.resolver-map"] = map1
    console.log("note.config: ", config)
    await obanotes.writeObaNoteConfig(note, config)
}

function _generateReferenceString(
    biblIO: BiblIOData
) {
    const doi = biblIO?.["doi"]
    const citekey = biblIO?.["citekey"]
    const year = biblIO?.["published-date"]?.["year"];
    const title = biblIO?.["title"]
    const author = biblIO?.["authors"]?.[0]?.["lastName"]
    
    let str = ''
    if (citekey) { str += `[[@${citekey}]] `; }
    if (year) { str += `(${year}) `; }
    if (author) { str += `${author}: `; }
    if (title) { str += `"${title}" `; }
    if (doi) { str += `${doi} `; }
    
    return str
}

export async function copyCitNoteReferencesSection(
    note: TFile
) {
    // get biblio data
    const biblIO0 = await citNoteBiblIO(note)
    const refBiblIOs = await citNoteReferenceBiblIOs(note)
    if (!refBiblIOs) { 
        new Notice("CitNote reference biblIOs missing")
        return; 
    }

    // collect
    const refStrs: string[] = []
    let refi = 0
    for (const biblIO of refBiblIOs) {
        let str = ''

        str += `> [${refi + 1}]  `;
        str += _generateReferenceString(biblIO)
        refStrs.push(str)
        refi += 1;
    } 
    const reference_section = refStrs.join('\n\n');
    await tools.copyToClipboard(reference_section);

    new Notice(`SUCESS!!! Reference copied to clipboard.\ndoi: ${biblIO0["doi"]}`)
}

async function copyCitNoteNonLocalReferences(
    note: TFile
) {

    // get biblio data
    const refbiblIOs = await citNoteReferenceBiblIOs(note);
    if (!refbiblIOs) { 
        new Notice("CitNote reference missing")
        return; 
    }

    // collect
    const nonLocalDOIs: string[] = []
    for (const refbiblIO of refbiblIOs) {
        console.log("refbiblIO: ", refbiblIO)
        const isLocal = localbibs.isLocal(refbiblIO)
        if (isLocal) { continue; }
        const doi = refbiblIO?.["doi"]
        if (!doi) { continue; }
        nonLocalDOIs.push(doi);
    }

    const reference_section = nonLocalDOIs.join('\n');
    await tools.copyToClipboard(reference_section);

    new Notice(`SUCESS!!! ${nonLocalDOIs.length} DOIs copied to clipboard`)
}



function _generateReferenceLink(
    refbiblIO: BiblIOData | null, 
    label = 'link'
) {
    let link = `[${label}]`; // default
    if (!refbiblIO) { return link; }
    const refCitekey = refbiblIO?.["citekey"]
    const refDOI = refbiblIO?.["doi"]
    if (refCitekey) {
        link = `[${label}](@${refCitekey})`
    } else if (refDOI) {
        link = `[${label}](${refDOI})`
    }
    
    return link
}

export async function copyCitNoteReferenceLink(
    note: TFile, 
    refnums: number[]
) {

    // get biblio data
    const refbiblIOs = await citNoteReferenceBiblIOs(note)
    if (!refbiblIOs) { 
        new Notice("References biblIO missing")
        return; 
    }

    const links: string[] = []
    for (const refnum of refnums) {
        const refbiblIO = refbiblIOs[refnum - 1]
        const link = _generateReferenceLink(refbiblIO, `${refnum}`)
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
        await statusbar.setText(`crossrefing: ${i + 1}/${tot}`);
        await crossref.fetchOnDemandCrossrefData(doi);
        i++;
    }
    await statusbar.setText('')
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

