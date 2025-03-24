import * as tools from '../tools-base/0-tools-modules';
import { parse } from '@retorquere/bibtex-parser';
import { existsSync, mkdirSync } from 'fs';
import { readFile, rm } from 'fs/promises';
import { join } from 'path';
import { BiblIOAuthor, BiblIOData, BiblIODate } from './biblio-data';
import { configfile, filesys } from 'src/oba-base/0-oba-modules';
import { OBA } from 'src/oba-base/globals';

/*
    Allow using local .bib files as sources of bibliography data. 
*/ 

// DOING/ Cache all in ram too
let MERGED_BIBLIO: BiblIOData[] = [];

export function onload() {
    console.log("LocalBibsBase:onload");
}

// MARK: biblio
export async function getBiblIO(doi: string) {
    return await findByDoi(doi)
}


function _makeBiblIO(lb_data: any) {
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

/*
    - LocalBibs are .bib files stored locally (no internet)
    - They are first parsed and cached on .json (faster to load)
    - Later, all them are merge and cached on RAM
*/ 

// MARK: merged
export async function getMergedBiblIO(
    sourceFiles: string[] = 
            configfile.getConfig("local.bib.files")
): Promise<BiblIOData[]> {
    // Check for updates
    const valid = await _validateRAMCache(sourceFiles, 'getMergedBiblIO')
    console.log(`ram.cache.valid: ${valid}`)
    if (valid) { 
        console.log("cached mergeBiblIO")
        return MERGED_BIBLIO 
    }
    console.log("building mergeBiblIO")
    const mergedBiblIO = await _buildMergedBiblIO(sourceFiles);
    // reset RAM cache
    clearRAMCache()
    MERGED_BIBLIO = mergedBiblIO;
    return MERGED_BIBLIO
}

async function _buildMergedBiblIO(
        sourceFiles: string[] = 
            configfile.getConfig("local.bib.files")
    ) {
    const mergedBiblIO: BiblIOData[] = [];
    for (const sourceFile of sourceFiles) {
        // load
        const lb_data = await getLocalBib(sourceFile);
        const entries = lb_data?.['entries'];
        if (!entries) { 
            console.error(`entries missing, sourceFile ${sourceFile}`)
            continue; 
        } 
        for (const entry of entries) {
            const biblio: BiblIOData = _makeBiblIO(entry)
            mergedBiblIO.push(biblio);
        }
    }
    return mergedBiblIO
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

async function parseOnDemandLocalBib(
        sourceFile: string,
        cacheFile: string = _getJSONCachePath(sourceFile)
    ) {
    
    // validate
    const valid = _validateJSONCache(cacheFile, sourceFile)
    console.log(`json.cache.valid: ${valid}`)
    if (valid) { 
        console.log(`cached! ${sourceFile}`)
        return "cached"
    }

    // parse/catch
    console.log(`parsing! ${sourceFile}`)
    const lb_data = await _parseBibFile(sourceFile)
    if (!lb_data) { return; }
    // Write cache
    await tools.writeJSON(cacheFile, lb_data);
    return "parsed";
}

export async function getLocalBib(
        sourceFile: string,
        cacheFile: string = _getJSONCachePath(sourceFile)
    ) {
    await parseOnDemandLocalBib(sourceFile, cacheFile)
    return await tools.loadJSON(cacheFile);
}

// MARK: ram cache
export function clearRAMCache() {
    MERGED_BIBLIO = [];
    DOI_IDX_MAP = {};
    CITEKEY_IDX_MAP = {};
}

async function _validateRAMCache(
    sourceFiles: string[] = configfile.getConfig("local.bib.files"),
    eventid = "validateRAMCache"
) {
    // Check spurce modifications
    for (const sourceFile of sourceFiles) {
        const ev = tools.compareMtimeMsCached(sourceFile, eventid)
        if (!ev["file.intact"]) { return false }
    }

    // invalidate if it is empty
    if (MERGED_BIBLIO.length == 0) { return false; }

    return true;
}

// MARK: json cache
export function getBibTexDir(): string {
    const obaDir = filesys.getObaDir();
    const _dir = join(obaDir, "localbibs");
    if (!existsSync(_dir)) {
        mkdirSync(_dir, { recursive: true });
    }
    return _dir;
}

function _validateJSONCache(cacheFile: string, sourceFile: string) {
    const ev = tools.compareMtimeMs(cacheFile, sourceFile);
    if (ev["file1.newest"]) {
        console.log(`cached! ${sourceFile}`)
        return true; 
    }
    return false
}

function _getJSONCachePath(sourceFile: string) {
    const hash = tools.hash64(sourceFile);
    return join(
        getBibTexDir(),
        `${hash}.cache.bib.json`
    )
}

export async function clearJSONCache() {
    const path = getBibTexDir();
    await rm(path, { recursive: true, force: true });
    if (existsSync(path)) {
        console.error(`clearing failed, path: ${path}`)
    } else {
        console.log(`clearing successfull, path: ${path}`)
    }
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
    
    function _number(str: any) {
        if (!str) { return null }
        return parseInt(str)
    }

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

// MARK: find
async function _findMergedBiblIO(
        hint0: string,
        checkFun: (biblio: BiblIOData) => boolean,
        IDX_MAP: { [key: string]: number }
    ) {
        
    let idx;
    let biblIO;
    const biblIOs = await getMergedBiblIO()
    
    // Check cache
    idx = IDX_MAP?.[hint0]
    if (idx >= 0) {
        biblIO = biblIOs?.[idx]
        if (biblIO) {
            console.log(`cached: ${hint0}`)
            return biblIO
        }
    }
    
    // search
    idx = 0;
    for (biblIO of biblIOs) {
        const match = checkFun(biblIO)
        if (match) { 
            IDX_MAP[hint0] = idx; // Up cache
            console.log(`found: ${hint0}`)
            return biblIO; 
        }
        idx += 1;
    }

    // fail
    return null;
}

let DOI_IDX_MAP: { [key: string]: number } = {};
export async function findByDoi(
    doi0: string
) {
    doi0 = tools.absDoi(doi0);
    return await _findMergedBiblIO(doi0,
        (biblIO: BiblIOData) => {
            const doi1 = biblIO["doi"]
            return tools.hasSuffix(doi0, doi1)
        },
        DOI_IDX_MAP
    )
}

let CITEKEY_IDX_MAP: { [key: string]: number } = {};
export async function findByCiteKey(
    citekey0: string
) {
    citekey0 = citekey0.replace(/^@/, '')
    return await _findMergedBiblIO(citekey0,
        (biblIO: BiblIOData) => {
            const citekey1 = biblIO["citekey"]
            return citekey0 == citekey1
        },
        CITEKEY_IDX_MAP
    )
}