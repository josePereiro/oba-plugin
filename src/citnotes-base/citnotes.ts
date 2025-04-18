import { Notice, TFile } from 'obsidian';
import { biblio, crossref, localbibs } from 'src/biblio-base/0-biblio-modules';
import { BiblIOData, BiblIOIder } from 'src/biblio-base/biblio-data';
import { OBA } from 'src/oba-base/globals';
import { checkEnable, tools } from 'src/tools-base/0-tools-modules';
import { obanotes } from 'src/obanotes-base/0-obanotes-modules';
import { citNoteBiblIO, citNoteReferenceBiblIOs, parseCitNoteCiteKey } from './citnotes-base';
import { statusbar } from 'src/services-base/0-servises-modules';
import { getCurrNote, getSelectedText } from 'src/tools-base/obsidian-tools';
export * from './citnotes-base'

/*
    Handle citation notes.
    - DONE/ parse metadata from citation notes
        - TAI/ keep a cache of such metadata
    - TODO/ Notify when format is invalid (linter)
    - TODO/ Make a parser (see ObaASTs)
    - TODO/ find dois in a note and update them to citekey if found
        - An automatic replacement
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
        id: "citnotes-dev",
        name: "CitNotes dev",
        callback: async () => {
            checkEnable("citnotes", { notice: true, err: true })
            console.clear();
            const note0 = getCurrNote();
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
    
    // TODO\ Make something like this but from all 
    // localbibs + references
    OBA.addCommand({
        id: "citnotes-copy-selected-reference-link-from-list",
        name: "CitNotes copy selected reference link from list",
        callback: async () => {
            checkEnable("citnotes", { notice: true, err: true })
            console.clear();
            // copy selection
            const sel0 = getSelectedText()
            await tools.copyToClipboard(sel0)
            const note0 = getCurrNote();
            await copySelectedCitNoteReferenceLinkFromList(note0, sel0)
        },
    });

    // OBA.addCommand({
    //     id: 'oba-citnotes-copy-reference-selected-doi',
    //     name: 'CitNotes copy references of selected doi',
    //     callback: async () => {
    //         checkEnable("citnotes", { notice: true, err: true })
    //         console.clear();
    //         const doi0 = getSelectedText()
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
            checkEnable("citnotes", { notice: true, err: true })
            console.clear();
            const note = getCurrNote()
            await this.copyCitNoteReferencesSection(note);
        }
    });

    OBA.addCommand({
        id: 'oba-citnotes-generate-references-resolver-map',
        name: 'CitNotes generate references resolver map',
        callback: async () => {
            checkEnable("citnotes", { notice: true, err: true })
            console.clear();
            const citnote = getCurrNote()
            await generateCitNoteConfigRefResolverMap(citnote)
        }
    });

    OBA.addCommand({
        id: "citnotes-copy-citstr-from-list",
        name: "CitNotes search citation from list",
        callback: async () => {
            checkEnable("citnotes", { notice: true, err: true })
            console.clear();
            const sel0 = getSelectedText() || ''
            const citnote = getCurrNote()
            await copySelectedCitationFromList(citnote, sel0)
        }
    });

    OBA.addCommand({
        id: 'oba-citnotes-copy-non-local-reference-current-note',
        name: 'CitNotes copy non-local references of current note',
        callback: async () => {
            checkEnable("citnotes", { notice: true, err: true })
            console.clear();
            const note = getCurrNote()
            await copyCitNoteNonLocalReferences(note);
        }
    });
    
    OBA.addCommand({
        id: "oba-citnotes-copy-link-selected-reference-number",
        name: "CitNotes copy link of selected reference number",
        callback: async () => {
            checkEnable("citnotes", { notice: true, err: true })
            console.clear();
            // const str = getSelectedText().
                // replace(/\D+/g, "")
            const str = getSelectedText()
            const refnums = extractRefNums(str);
            const note = getCurrNote()
            await copyCitNoteReferenceLink(note, refnums)
        }
    });

    OBA.addCommand({
        id: "oba-citnotes-download-all-local-notes",
        name: "CitNotes download all local notes",
        callback: async () => {
            checkEnable("citnotes", { notice: true, err: true })
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


// DEV
// TODO: make a search bib interface
// - It is just this but with all local bibs
// - Maybe if a citenote is open, search also in its references
// - Maybe search in all crossref cache
// - Signal the procedence of each item
//  -  citref, local, crossref
//  - Make an interface for loading all crossref cache
// TODO/ I need to improve searching
//  - Maybe take over it completelly
//  - 
// const localBiblIOs = await localbibs.getMergedBiblIO()
// refBiblIOs.push(...localBiblIOs)

async function copySelectedCitationFromList(
    note0: TFile,
    sel0 = ''
) {
    // select from list
    console.log("note0: ", note0);
    // const biblIOs = [] as BiblIOData[];
    const references: string[] = []
    const refBiblIOs = await citNoteReferenceBiblIOs(note0);
    if (!refBiblIOs) {
        console.log("No references found. note0: ", note0);
    } else {
        const references1 = getCitationStringToSearch(refBiblIOs, { suffix: ' {ref}'});
        references.push(...references1)
    }
    const localBiblIOs = await localbibs.getMergedBiblIO()
    if (!localBiblIOs) {
        console.log("localBiblIOs not found");
    } else {
        const references1 = getCitationStringToSearch(localBiblIOs, { suffix: ' {local}'});
        references.push(...references1)
    }
    // TODO: add all from crossref cache?

    if (!references || references.length === 0) {
        console.log(`No references found. citekey: ${note0}`);
        return;
    }
    
    const query = !sel0 ? '' : sel0
        .normalize("NFD")
        .replace(/[^a-zA-Z0-9\s]/g, ' ')
        .replace(/ et\.? al\.?,?;?/g, ' ')
        .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
        .replace(/\s\s/g, ' ')
        .trim();

    const modal = new tools.SelectorModalV2(
        references, 
        "Select reference to copy link",
        query,
        async (refnum: number) => {
            if (refnum == -1) { return; }
            console.clear();
            console.log("refnum: ", refnum+1);
            const ref = references?.[refnum]
            if (!ref) { return; }
            await tools.copyToClipboard(ref)
            new Notice(`Cit copied. cit: ${ref}`);
        }
    );
    modal.open()
}

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
    
    const query = !sel0 ? '' : sel0
        .normalize("NFD")
        .replace(/[^a-zA-Z0-9\s]/g, ' ')
        .replace(/ et\.? al\.?,?;?/g, ' ')
        .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
        .replace(/\s\s/g, ' ')
        .trim();

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
        statusbar.setText(`crossrefing: ${i + 1}/${tot}`);
        await crossref.fetchOnDemandCrossrefData(doi);
        i++;
    }
    statusbar.clear()
}

// MARK: utils
function extractRefNums(str: string): number[] {
    // Extract all numeric sequences from the input string
    const matches = str.match(/\d+/g);
    if (!matches) { return []; }
    // Convert the numeric sequences to integers and return them
    return matches.map(num => parseInt(num, 10));
}

function getCitationStringV1(biblIO: BiblIOData) {
    const MAX_AUTHORS = 5;
    let authors = biblIO?.["authors"]?.map(author => author?.["lastName"]) || ["Unknown Author"];
    if (authors.length > MAX_AUTHORS) {
        authors = authors.slice(0, MAX_AUTHORS).concat(["et al."]);
    }
    const authorsStr = authors.join(", ");
    const title = biblIO?.["title"] || "Untitled";
    const citekey = biblIO?.["citekey"] || "No Citekey";
    const year = biblIO?.["published-date"]?.["year"] || "Unknown Year";
    const doi = biblIO?.["doi"] || "No DOI";
    let cit = `${authorsStr} (${year}). "${title}" [${citekey}] (${doi})`;
    return cit.normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
        .trim();
}

function getCitationStringToSearch(
    biblIOs: BiblIOData[],
    {
        prefix = '',
        suffix = '',
    }
) {
    
    let refi = 1;
    const citStrs: string[] = [];
    for (const biblIO of biblIOs) {
        const body = getCitationStringV1(biblIO);
        const cit = `${prefix}[${refi}] ${body}${suffix}`
        citStrs.push(cit)
        refi++;
    }
    return citStrs
}

