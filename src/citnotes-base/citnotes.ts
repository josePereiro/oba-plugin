import { Notice, TFile } from 'obsidian';
import { biblio, localbibs } from 'src/biblio-base/0-biblio-modules';
import { BiblIOIder } from 'src/biblio-base/biblio-data';
import { OBA } from 'src/oba-base/globals';
import { tools } from 'src/tools-base/0-tools-modules';

/*
    Handle citation notes.
    - parse metadata from citation notes
        - keep a cache of such metadata
    - Notify when format is invalid
    - Replacements
        - Replace #!REF13 by the citekey if it is present in the bibtex db
            - Use crossref for getting References
*/

// MARK: constructor
export function onload() {
    console.log("CitNotes:onload");
    
    // OBA.addCommand({
    //     id: "CitNotes-dev",
    //     name: "CitNotes dev",
    //     callback: async () => {
    //         console.clear();
    //     },
    // });

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
            const str = tools.getSelectedText().
                replace(/\D+/g, "")
            const refnum = parseInt(str);
            const citekey = getCitNoteCiteKey()
            await copyReferenceLink({citekey}, refnum)
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
    id0: BiblIOIder, refnum: number
) {

    // get biblio data
    const biblIO_0 = await biblio.consensusBiblIO(id0);
    const refDOIs = biblIO_0["references-DOIs"];
    if (!refDOIs) { return; }
    const refDOI = refDOIs?.[refnum - 1]
    if (!refDOI) { return; }
    
    const biblIO_1 = await biblio.consensusBiblIO({doi: refDOI});
    if (!biblIO_1) { return; }
    await tools.copyToClipboard(""); // clear clipboard
    const refCitekey = biblIO_1?.["citekey"]
    let link = '';
    if (refCitekey) {
        link = `\\[[[@${refCitekey}|${refnum}]]\\]`
    } else {
        new Notice(`🚨 ERROR: Missing citekey, doi ${refDOI}`)
        link = `\\[[${refnum}](${refDOI})]]\\`
    }
    await tools.copyToClipboard(link);
    new Notice(`Link copied in clipboard, link: ${link}`);
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