import * as tools from '../tools-base/0-tools-base';
import { parse } from '@retorquere/bibtex-parser';
import { existsSync, mkdirSync } from 'fs';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { BiblIOAuthor, BiblIOData, BiblIODate } from './biblio-data';
import { configfile, filesys } from 'src/oba-base/0-oba-base';
import { OBA } from 'src/oba-base/globals';

/*
    Allow using local .bib files as sources of bibliography data. 
    // TODO/ keep a loaded ram copy (BIB)
    // TODO/ clean conceptually.
    //  - keep jaon only for backends
    //  - Plugin should use RAM/Parsed pair
    //  - Use the same engine for updating stuff
    //  - Maybe cach whole biblIODB, not source file caches. 
*/ 

// DOING" Cache all in ram too
let BIB: BiblIOData[] = [];
// const BIB: { [key: string]: BiblIOData[] } = {};

export function onload() {
    console.log("LocalBibsBase:onload");
}

// MARK: biblio
export function _makeBiblIO(lb_data: any) {
    const biblio: BiblIOData = {
        "doi": extractDoi(lb_data),
        "citekey": extractCiteKey(lb_data),
        "type": extractType(lb_data),
        "title": extractTitle(lb_data),
        "authors": extractAuthors(lb_data),
        "created-date": extractCreatedDate(lb_data),
        "deposited-date": extractDepositedDate(lb_data),
        "issued-date": extractIssuedDate(lb_data),
        "published-date": extractPublishedDate(lb_data),
        "journaltitle": extractJournalTitle(lb_data),
        "url": extractURL(lb_data),
        "abstract": extractAbstract(lb_data),
        "keywords": extractKeywords(lb_data),
        "references-count": extractReferencesCount(lb_data),
        "references-DOIs": extractReferencesDOIs(lb_data),
        // "extras": extractExtras(lb_data),
        "extras": {},
    }
    return biblio
}

export async function getBiblioDB(
    sourceFiles: string[] = 
        configfile.getConfig("local.bib.files")
) {
    if (!anyCacheDeprecated(sourceFiles)) { 
        console.log("return old BIB")
        return BIB 
    }
    console.log("return new BIB")
    const biblioDB: BiblIOData[] = [];
    const lb_dataDB = await getLocalBib(sourceFiles)
    for (const lb_data of lb_dataDB) {
        const biblio: BiblIOData = _makeBiblIO(lb_data)
        biblioDB.push(biblio);
    }
    BIB = biblioDB; // Up ram
    return biblioDB
}

// Search doi
export async function getBiblio(doi0: string, 
    sourceFiles: string[] = 
        configfile.getConfig("local.bib.files")
) {
    const lb_dataDB = await getLocalBib(sourceFiles)
    for (const lb_data of lb_dataDB) {
        const doi1 = lb_data?.["fields"]?.["doi"]
        if (!doi1) { continue; }
        if (!tools.hasSuffix(doi0, doi1)) { continue; }
        const biblio: BiblIOData = _makeBiblIO(lb_data)
        return biblio
    }
    return null
}

// MARK: parse/load
async function _parseBibFile(sourceFile: string) {
    try {
        const bibContent = await readFile(sourceFile, 'utf-8');
        const parsedBib = parse(bibContent);
        return parsedBib;
    } catch (error) {
        console.error('Error reading or parsing .bib file:', error);
        throw error;
    }
}

async function _parseOnDemandLocalBib(sourceFile: string) {
    // Check file
    const cacheFile = _getCachePath(sourceFile)
    const ev = tools.compareMtimeMs(cacheFile, sourceFile);
    if (!ev["file2.newest"]) {
        console.log(`cached! ${sourceFile}`)
        return "cached"; 
    }
    // parse/catch
    console.log(`parsing! ${sourceFile}`)
    const lb_data = await _parseBibFile(sourceFile)
    if (!lb_data) { return; }
    await tools.writeJSON(cacheFile, lb_data);
    return "parsed";
}

async function anyCacheDeprecated(
    sourceFiles: string[] = configfile.getConfig("local.bib.files")
) {
    for (const sourceFile of sourceFiles) {
        const cacheFile = _getCachePath(sourceFile)
        const ev = tools.compareMtimeMs(cacheFile, sourceFile);
        if (ev["file2.newest"]) {
            // console.log(`cached! ${sourceFile}`)
            return true;
        }
    }
    return false;
}

export async function parseOnDemandLocalBib(sourceFile: string) {
    await _parseOnDemandLocalBib(sourceFile)
}

export async function getLocalBib(
    sourceFiles: string[] = 
        configfile.getConfig("local.bib.files")
) {
    const lb_merged = [];
    for (const sourceFile of sourceFiles) {
        // load
        await _parseOnDemandLocalBib(sourceFile);
        const lb_data = await _loadBibCache(sourceFile);
        // merge
        const entries = lb_data?.['entries'];
        if (!entries) { continue; } 
        for (const elm of entries) { lb_merged.push(elm); }
    }
    return lb_merged
}


// MARK: extract
// All extract methods must return null if failed
function extractDoi(lb_data: any): string | null {
    try {
        const dat0 = lb_data["fields"]["doi"]
        if (!dat0) { return null; } 
        return tools.absDoi(dat0);
    } catch (error) { return null; }
}

function extractCiteKey(lb_data: any): string | null {
    try {
        const dat0 = lb_data["key"]
        if (!dat0) { return null; } 
        return dat0
    } catch (error) { return null; }
}

function extractType(lb_data: any): string | null {
    try {
        const dat0 = lb_data["type"]
        if (!dat0) { return null; } 
        return dat0
    } catch (error) { return null; }
}

function extractTitle(lb_data: any): string | null {
    try{
        const dat0 = lb_data["fields"]['title']
        if (!dat0) { return null}
        return dat0
    } catch (error) { return null; }
}

function extractAuthors(lb_data: any): BiblIOAuthor[] | null {
    try{
        const dat0 = lb_data["fields"]["author"]
        if (!dat0) { return null; }
        const authors: BiblIOAuthor[] = [];
        for (const authori of dat0) {
            const author: BiblIOAuthor = {
                "firstName": authori?.["firstName"] ?? '',
                "lastName": authori?.["lastName"] ?? '',
                "ORCID": authori?.["ORCID"] ?? null,
                "affiliations": [],
            }
            authors.push(author);
        }
        return authors;
    } catch (error) { return null; }
}

function extractCreatedDate(lb_data: any): BiblIODate | null {
    return null
}

function extractDepositedDate(lb_data: any): BiblIODate | null {
    return null
}

function extractIssuedDate(lb_data: any): BiblIODate | null {
    return null
}

function extractPublishedDate(lb_data: any): BiblIODate | null {
    try {
        const dat0 = lb_data["fields"]["date"]
        const dat1 = dat0.split("-")
        const date: BiblIODate = {
            "year": _number(dat1[0]),
            "month": _number(dat1?.[1]),
            "day": _number(dat1?.[2]),
        }
        return date
    } catch (error) { 
        // console.log(error)
        return null; 
    }
}   

function extractJournalTitle(lb_data: any): string | null {
    try {
        const dat0 = lb_data["fields"]["journaltitle"]
        if (!dat0) { return null}
        return dat0
    } catch (error) { return null; }
}

function extractURL(lb_data: any): string | null {
    try {
        const dat0 = lb_data["fields"]["url"]
        if (!dat0) { return null}
        return dat0
    } catch (error) { return null; }
}

function extractAbstract(lb_data: any): string | null {
    try {
        const dat0 = lb_data["fields"]["abstract"]
        if (!dat0) { return null}
        return dat0
    } catch (error) { return null; }
}

function extractKeywords(lb_data: any): string[] | null {
    try {
        const dat0 = lb_data["fields"]["keywords"]
        if (!dat0) { return null}
        return dat0
    } catch (error) { return null; }
}

function extractReferencesCount(lb_data: any): null {
    return null
}

function extractReferencesDOIs(lb_data: any): null {
    return null
}

function extractExtras(lb_data: any): any {
    return { "localbib": lb_data }
}

// MARK: cache

export function getBibTexDir(): string {
    const obaDir = filesys.getObaDir();
    const _dir = join(obaDir, "localbibs");
    if (!existsSync(_dir)) {
        mkdirSync(_dir, { recursive: true });
    }
    return _dir;
}

function _hasCache(sourceFile: string) {
    const path = _getCachePath(sourceFile)
    return existsSync(path)
}

function _getCachePath(sourceFile: string) {
    const hash = tools.hash64(sourceFile);
    return join(
        getBibTexDir(),
        `${hash}.cache.bib.json`
    )
}

async function _loadBibCache(sourceFile: string) {
    const path = _getCachePath(sourceFile)
    return await tools.loadJSON(path);
}

function _writeCache(sourceFile: string, lb_data: any) {
    const path = _getCachePath(sourceFile);
    return tools.writeJSON(path, lb_data);
}

// MARK: Utils
function _number(str0: string) {
    const str = str0.trim();
    if (!str) { return null; }
    return Number(str)
}


/*
// MARK: Example
[
{
    "type": "article",
    "key": "a.hjortsoPopulationBalanceModels1995",
    "fields": {
        "title": "Population balance models of autonomous microbial oscillations",
        "author": [
            {
                "lastName": "A. Hjortso",
                "firstName": "Martin"
            },
            {
                "lastName": "Nielsen",
                "firstName": "Jens"
            }
        ],
        "date": "1995-10-16",
        "journaltitle": "Journal of Biotechnology",
        "shortjournal": "Journal of Biotechnology",
        "volume": "42",
        "number": "3",
        "pages": "255–269",
        "issn": "0168-1656",
        "doi": "10.1016/0168-1656(95)00086-6",
        "url": "http://www.sciencedirect.com/science/article/pii/0168165695000866",
        "urldate": "2021-01-10",
        "abstract": "Autonomous oscillations in ...",
        "langid": "english",
        "file": "/Users/Pereiro/Zotero/storage/3FV9XSE7/0168165695000866.html",
        "keywords": [
            "Age distribution",
            "Autonomous oscillation",
            "Microbial population",
            "Population balance"
        ]
    },
    "mode": {
        "title": "title",
        "author": "creatorlist",
        "date": "literal",
        "journaltitle": "literal",
        "shortjournal": "literal",
        "volume": "literal",
        "number": "literal",
        "pages": "literal",
        "issn": "literal",
        "doi": "verbatim",
        "url": "verbatim",
        "urldate": "literal",
        "abstract": "literal",
        "langid": "literal",
        "keywords": "verbatimlist",
        "file": "verbatim"
    },
    "input": "@article{a.hjortsoPopulationBalanceModels1995,\n  title = {Population Balance Models of Autonomous Microbial Oscillations},\n  author = {A. Hjortso, Martin and Nielsen, Jens},\n  date = {1995-10-16},\n  journaltitle = {Journal of Biotechnology},\n  shortjournal = {Journal of Biotechnology},\n  volume = {42},\n  number = {3},\n  pages = {255--269},\n  issn = {0168-1656},\n  doi = {10.1016/0168-1656(95)00086-6},\n  url = {http://www.sciencedirect.com/science/article/pii/0168165695000866},\n  urldate = {2021-01-10},\n  abstract = {Autonomous oscillations...},\n  file = {/Users/Pereiro/Zotero/storage/3FV9XSE7/0168165695000866.html}\n}"
},
...
]
*/ 