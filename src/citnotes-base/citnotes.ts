import { Notice, TFile } from 'obsidian';
import { biblio, crossref, localbibs } from 'src/biblio-base/0-biblio-modules';
import { BiblIOData, BiblIOIder } from 'src/biblio-base/biblio-data';
import { OBA } from 'src/oba-base/globals';
import { tools } from 'src/tools-base/0-tools-modules';
import { consensusReferences } from 'src/biblio-base/biblio';

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
            const citekey0 = getCitNoteCiteKey();
            const biblIOs = await consensusReferences({citekey: citekey0});
            if (!biblIOs) {
                new Notice(`No references found. citekey: ${citekey0}`);
                return;
            }
            const references = getCitationStringToSearch(biblIOs);
            if (!references || references.length === 0) {
                new Notice(`No references found. citekey: ${citekey0}`);
                return;
            }
            const modal = new tools.SelectorModalV2(
                references, 
                "Select reference to copy link",
                async (sel: number) => {
                    if (sel == -1) { return; }
                    console.clear();
                    console.log("sel: ", sel);
                    await copyReferenceLink({citekey: citekey0}, [sel+1]);
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
            const citekey = getCitNoteCiteKey()
            await this.copyDoiReferences({citekey});
        }
    });

    OBA.addCommand({
        id: 'oba-citnotes-copy-non-local-reference-current-note',
        name: 'CitNotes copy non-local references of current note',
        callback: async () => {
            console.clear();
            const citekey = getCitNoteCiteKey()
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
            const citekey = getCitNoteCiteKey()
            await copyReferenceLink({citekey}, refnums)
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

// DOING: reimplement all this using BiblIO

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
    id0: BiblIOIder, refnums: number[]
) {

    // get biblio data
    const biblIO_0 = await biblio.consensusBiblIO(id0);
    const refDOIs = biblIO_0["references-DOIs"];
    if (!refDOIs) { return; }
    const links: string[] = []

    for (const refnum of refnums) {
        const refDOI = refDOIs?.[refnum - 1]
        let link = '';
        while (1) {
            if (!refDOI) { 
                link = `${refnum}`
                break;
            }
            const biblIO_1 = await biblio.consensusBiblIO({doi: refDOI});
            if (!biblIO_1) { 
                link = `[${refnum}](${refDOI})`
                break;
            }
            const refCitekey = biblIO_1?.["citekey"]
            if (refCitekey) {
                link = `[[@${refCitekey}|${refnum}]]`
            } else {
                // new Notice(`🚨 ERROR: Missing citekey, doi ${refDOI}`)
                link = `[${refnum}](${refDOI})`
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

// // MARK: extract
// // TODO/TAI: do not rely on the note name
// // - Maybe add a citekey field on the yalm section of the note
export function getCitNoteCiteKey(note: TFile = tools.getCurrNote()) {
    return note?.basename?.
        replace(/\.md$/, '')?.
        replace(/^@/, '')
}

// MARK: get
export async function getNoteBiblIO(
    note: TFile = tools.getCurrNote()
) {
    const citekey = this.getCitNoteCiteKey(note);
    return await biblio.consensusBiblIO({citekey})
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
function extractRefNums(str: string): number[] {
    // Extract all numeric sequences from the input string
    const matches = str.match(/\d+/g);
    if (!matches) { return []; }
    // Convert the numeric sequences to integers and return them
    return matches.map(num => parseInt(num, 10));
}

// MARK: utils
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