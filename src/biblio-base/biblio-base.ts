import { citnotes } from "src/citnotes-base/0-citnotes-modules";
import { crossref, localbibs } from "./0-biblio-modules";
import { BiblIOAuthor, BiblIOData, BiblIODate, BiblIOIder } from "./biblio-data";
import { tools } from "src/tools-base/0-tools-modules";
import { statusbar } from "src/services-base/0-servises-modules";

// MARK: consensus
/*
    merge biblIOs from several sources
*/ 
export async function consensusBiblIO(id: BiblIOIder) {

    // handle id
    await resolveBiblIOIder(id);
    
    // get data
    const doi0 = id["doi"]
    console.log("doi0: ", doi0)
    //TODO/ I need to built a system to handle missing refs on crossref
    // If not, it will try to download them all the time, it is time consumming
    const rc_biblIO = await crossref.getBiblIO(id); 
    const lb_biblIO = await localbibs.getBiblIO(id);
    
    const biblio: BiblIOData = {
        "doi":                  extractDoi(lb_biblIO, rc_biblIO),
        "citekey":              extractCiteKey(lb_biblIO, rc_biblIO),
        "type":                 extractType(lb_biblIO, rc_biblIO),
        "title":                extractTitle(lb_biblIO, rc_biblIO),
        "authors":              extractAuthors(lb_biblIO, rc_biblIO),
        "created-date":         extractCreatedDate(rc_biblIO, lb_biblIO),
        "deposited-date":       extractDepositedDate(rc_biblIO, lb_biblIO),
        "published-date":       extractIssuedDate(rc_biblIO, lb_biblIO),
        "issued-date":          extractPublishedDate(rc_biblIO, lb_biblIO),
        "journaltitle":         extractJournalTitle(lb_biblIO, rc_biblIO),
        "url":                  extractURL(lb_biblIO, rc_biblIO),
        "abstract":             extractAbstract(lb_biblIO, rc_biblIO),
        "keywords":             extractKeywords(lb_biblIO, rc_biblIO),
        "references-count":     extractReferencesCount(rc_biblIO, lb_biblIO),
        "references-map":       extractReferencesMap(rc_biblIO, lb_biblIO),
        "extras":               extractExtras(rc_biblIO, lb_biblIO)
    }
    return biblio;
}

export async function consensusReferenceBiblIOs(
    biblIO: BiblIOData
) {
    const nref = biblIO["references-count"]
    const map = biblIO["references-map"]
    type T = BiblIOData | null;
    const biblIOs: T[] = []
    for (let refi = 1; refi <= nref; refi++) {
        const ider = map?.[refi]
        statusbar.setText(`fetching ${refi}/${nref}`);
        if (ider) {
            const biblIO = await consensusBiblIO(ider)
            biblIOs.push(biblIO);
        } else {
            const msg = `Reference number ${refi} not found in resolver map`;
            biblIOs.push(null);
            console.warn(msg);
        }
    }
    statusbar.clear();
    return biblIOs
}

// MARK: extract
function _formatToSimpleLine(text: string | null) {
    if (!text) { return text; }
    return tools.fixPoint(text, (texti: string) => {
        return texti.trim().
            replace(/<[^>]*?>/, "").
            replace(/\n/, "").
            replace(/\s\s/, "")
    })
}

function _extractAsPlainText(...sources: any[]) {
    const title = tools._extractFirst("title", ...sources)
    return _formatToSimpleLine(title)
}

// All extract methods must return null if failed
function extractDoi(...sources: any[]): string | null {
    return tools._extractFirst("doi", ...sources)
}

function extractCiteKey(...sources: any[]): string | null {
    return tools._extractFirst("citekey", ...sources)
}

function extractType(...sources: any[]): string | null {
    return tools._extractFirst("type", ...sources)
}

function extractTitle(...sources: any[]): string | null {
    return _extractAsPlainText("title", ...sources)
}

function extractAuthors(...sources: any[]): BiblIOAuthor[] | null {
    return tools._extractFirst("authors", ...sources)
}

function extractCreatedDate(...sources: any[]): BiblIODate | null {
    return tools._extractFirst("created-date", ...sources)
}

function extractDepositedDate(...sources: any[]): BiblIODate | null {
    return tools._extractFirst("deposited-date", ...sources)
}

function extractIssuedDate(...sources: any[]): BiblIODate | null {
    return tools._extractFirst("issued-date", ...sources)
}

function extractPublishedDate(...sources: any[]): BiblIODate | null {
    return tools._extractFirst("published-date", ...sources)
}   

function extractJournalTitle(...sources: any[]): string | null {
    return tools._extractFirst("journaltitle", ...sources)
}

function extractURL(...sources: any[]): string | null {
    return tools._extractFirst("url", ...sources)
}

function extractAbstract(...sources: any[]): string | null {
    return tools._extractFirst("abstract", ...sources)
}

function extractKeywords(...sources: any[]): string[] | null {
    return tools._extractFirst("keywords", ...sources)
}

function extractReferencesCount(...sources: any[]): null {
    return tools._extractFirst("references-count", ...sources)
}

function extractReferencesMap(...sources: any[]): null {
    return tools._extractFirst("references-map", ...sources)
}

function extractExtras(...sources: any[]): any {
    const objs = tools._extractField("extras", ...sources)
    return tools._mergeAll(...objs)
}

// MARK: ider
export async function resolveBiblIOIderDOI(id: BiblIOIder) {
    if (id?.["doi"]) { return true; } 
    if (id?.["citekey"]) {
        const lb_biblIO = await localbibs.findByCiteKey(id["citekey"])
        const doi = lb_biblIO?.["doi"]
        if (!doi) { return false; }
        id["doi"] = doi
        return true; 
    } 
    if (id?.["citnote"]) {
        const note = id["citnote"]
        const citekey = await citnotes.parseCitNoteCiteKey(note)
        if (citekey) {
            id["citekey"] = citekey 
            return await resolveBiblIOIderDOI(id); 
        }
    }
    if (id?.["query"]) {
        // local search first
        let lb_biblIO;
        lb_biblIO = await localbibs.findByCiteKey(id["query"])
        if (lb_biblIO) {
            const doi = lb_biblIO?.["doi"]
            if (doi) { 
                id["doi"] = doi
                return true; 
            }
        }
        lb_biblIO = await localbibs.findByDoi(id["query"])
        if (lb_biblIO) {
            const doi = lb_biblIO?.["doi"]
            if (doi) { 
                id["doi"] = doi
                return true; 
            }
        }
        // default to doi
        id["doi"] = id["query"]
        return false; 
    }
    return false; 
}

// TODO/ make it resolve more than doi
export async function resolveBiblIOIder(id: BiblIOIder) {
    await resolveBiblIOIderDOI(id)
    return id
}

export function collectReferenceIders(
    biblIO: BiblIOData
) {
    const nref = biblIO["references-count"]
    const map = biblIO["references-map"]
    type T = BiblIOIder | null;
    const iders: T[] = []
    for (let i = 1; i <= nref; i++) {
        const ider = map?.[i] ?? null
        iders.push(ider);
    }
    return iders
}