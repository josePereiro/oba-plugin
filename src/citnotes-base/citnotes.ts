import { Notice, TFile } from 'obsidian';
import { crossref, localbibs } from 'src/biblio-base/0-biblio-modules';
import { BiblIOData } from 'src/biblio-base/biblio-data';
import { addObaCommand } from 'src/oba-base/commands';
import { OBA } from 'src/oba-base/globals';
import { getObaConfig } from 'src/oba-base/obaconfig';
import { getState, setState } from 'src/oba-base/state';
import { obanotes } from 'src/obanotes-base/0-obanotes-modules';
import { statusbar } from 'src/services-base/0-servises-modules';
import { checkEnable, tools } from 'src/tools-base/0-tools-modules';
import { getCurrNote, getSelectedText } from 'src/tools-base/obsidian-tools';
import { citNoteBiblIO, citNoteReferenceBiblIOs, parseCitNoteCiteKey } from './citnotes-base';
export * from './citnotes-base';

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

    addObaCommand({
        commandName: "test",
        serviceName: ["CitNotes", "Dev"],
        async commandCallback({ commandID, commandFullName }) {
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
        },
    })

    addObaCommand({
        commandName: "copy references of current note",
        serviceName: ["CitNotes"],
        async commandCallback({ commandID, commandFullName }) {
            console.clear();
            const note = getCurrNote()
            await this.copyCitNoteReferencesSection(note);
        },
    })

    addObaCommand({
        commandName: "generate references resolver map",
        serviceName: ["CitNotes"],
        async commandCallback({ commandID, commandFullName }) {
            console.clear();
            const citnote = getCurrNote()
            await generateCitNoteConfigRefResolverMap(citnote)
        },
    })

    addObaCommand({
        commandName: "search citation from list",
        serviceName: ["CitNotes"],
        async commandCallback({ commandID, commandFullName }) {
            console.clear();
            const sel0 = getSelectedText() || ''
            const citnote = getCurrNote()
            const template = getState(
                'citnotes.citation.current.template', 
                `[[@citekey]]`
            )
            await copySelectedCitationFromList(citnote, sel0, template)
        },
    })

    addObaCommand({
        commandName: "select current citation template",
        serviceName: ["CitNotes"],
        async commandCallback({ commandID, commandFullName }) {
            const templates = getObaConfig("citnotes.citation.templates", [])
            new tools.SelectorModalV2(
                templates, 
                "Select template",
                '',
                async (refnum: number) => {
                    if (refnum == -1) { return; }
                    console.clear();
                    setState('citnotes.citation.current.template', templates[refnum])
                    new Notice(`Template changed`);
                }
            ).open()
        },
    })

    addObaCommand({
        commandName: "copy non-local references of current note",
        serviceName: ["CitNotes"],
        async commandCallback({ commandID, commandFullName }) {
            console.clear();
            const note = getCurrNote()
            await copyCitNoteNonLocalReferences(note);
        },
    })

    addObaCommand({
        commandName: "copy link of selected reference number",
        serviceName: ["CitNotes"],
        async commandCallback({ commandID, commandFullName }) {
            console.clear();
            // const str = getSelectedText().
                // replace(/\D+/g, "")
            const str = getSelectedText()
            const refnums = extractRefNums(str);
            const note = getCurrNote()
            await copyCitNoteReferenceLink(note, refnums)
        },
    })

    addObaCommand({
        commandName: "download all local notes",
        serviceName: ["CitNotes"],
        async commandCallback({ commandID, commandFullName }) {
            console.clear();
            await downloadAllLocalReferences()
        },
    })

}

// TODO/
// - DONE/ Use RefResolverMap for all Reference related methods
// - TODO/ Use regex in the RefResolverMap keys
// - TODO/First resolve Iders and them retrive biblIOs
// - TODO/Add a general biblIO search interface
//  - Change BiblIOIder to BiblIOQuery
//      - or just use a incomplete BiblIOData object

// MARK: copy


// TODO/ move out

export function expandTemplateFromObject(
    obj: {[keys: string]: string}, 
    template: string
) {
    for (const key in obj) {
        const val = obj[key]
        const regex = new RegExp(`{{${key}}}`, 'g')
        template = template.replace(regex, val)
    }
    return template
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
}

export function expandTemplateFromBiblIO(
    biblIO: BiblIOData, 
    template: string, 
    extras: {[keys: string]: string} = {}
) {
    // expand biblio
    return expandTemplateFromObject({
        "shortAuthors": _shortAuthorsStr(biblIO, 2),
        "title": biblIO?.["title"] || "No title",
        "citekey": biblIO?.["citekey"] || "No Citekey",
        "year": biblIO?.["published-date"]?.["year"]?.toString() || "No Year",
        "doi": biblIO?.["doi"] || "No DOI",
        ...extras
    }, template)
}



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
// MARK: copySelectedCitationFromList
async function copySelectedCitationFromList(
    note0: TFile,
    sel0 = '',
    citTemplate: string
) {
    // select from list
    console.log("note0: ", note0);
    // const biblIOs = [] as BiblIOData[];
    const biblIOs: BiblIOData[] = []
    const extrasAll: {[keys: string]: string}[] = []
    const refBiblIOs = await citNoteReferenceBiblIOs(note0) || []
    for (let citenum = 0; citenum < refBiblIOs.length; citenum++) {
        const refBiblIO = refBiblIOs[citenum]
        extrasAll.push({suffix: ' #ref', citenum: `${citenum}`})
        biblIOs.push(refBiblIO)
    }
    
    const localBiblIOs = await localbibs.getMergedBiblIO() || []
    for (let citenum = 0; citenum < localBiblIOs.length; citenum++) {
        const localBiblIO = localBiblIOs[citenum]
        extrasAll.push({suffix: ' #localbib', citenum: `${citenum}`})
        biblIOs.push(localBiblIO)
    }
    // TODO: add all from crossref cache?

    const searchStrs: string[] = []
    const searchTemplate = `[{{citenum}}] {{shortAuthors}} ({{year}}). "{{title}}" [[@{{citekey}}]] ({{doi}}) {{suffix}}`
    for (let bibi = 0; bibi < biblIOs.length; bibi++) {
        const biblIO = biblIOs[bibi]
        const extras = extrasAll[bibi]
        const searchStr = expandTemplateFromBiblIO(
            biblIO, searchTemplate, extras
        )
        searchStrs.push(searchStr)
    }
    

    if (!searchStrs || searchStrs.length === 0) {
        console.log(`No citation data found.`);
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
        searchStrs, 
        "Select reference to copy link",
        query,
        async (refnum: number) => {
            if (refnum == -1) { return; }
            console.clear();
            console.log("refnum: ", refnum+1);
            const biblIO = biblIOs?.[refnum]
            if (!biblIO) { return; }
            const extras = extrasAll?.[refnum]
            if (!extras) { return; }
            const cit = expandTemplateFromBiblIO(
                biblIO, citTemplate, extras
            )
            await tools.copyToClipboard(cit)
            new Notice(`Cit copied`, 300);
        }
    );
    modal.open()
}

function _formatQueryForSelectorModalV2(
    query: string | null
){
    if (!query) { return '' }
    return query
        .normalize("NFD")
        .replace(/[^a-zA-Z0-9\s]/g, ' ')
        .replace(/ et\.? al\.?,?;?/g, ' ')
        .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
        .replace(/\s\s/g, ' ')
        .trim();
}

// MARK: copySelectedCitNoteReferenceLinkFromList
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
    
    const query = _formatQueryForSelectorModalV2(sel0)    
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

// MARK: generateCitNoteConfigRefResolverMap
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

// MARK: copyCitNoteReferencesSection
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

function _shortAuthorsStr(biblIO: BiblIOData, n: number) {
    let authors = biblIO?.["authors"]?.map(author => author?.["lastName"]) || ["No Author(s)"];
    if (authors.length > n) {
        authors = authors.slice(0, n);
        return authors.join(', ') + ' et al.'
    }
    return authors.join(', ')
}

function getCitationStringToSearch(
    biblIOs: BiblIOData[],
    {
        prefix = '',
        suffix = '',
    } = {}
) {
    const template = `{{prefix}}[{{refi}}] {{shortAuthors}} ({{year}}). "{{title}}" [[@{{citekey}}]] ({{doi}}) {{suffix}}`
    let refi = 1;
    const citStrs: string[] = [];
    for (const biblIO of biblIOs) {
        const cit = expandTemplateFromBiblIO(
            biblIO, template, 
            { prefix, refi: refi.toString() }
        )
        citStrs.push(cit)
        refi++;
    }
    return citStrs
}

