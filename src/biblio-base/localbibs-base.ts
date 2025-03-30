import { tools } from '../tools-base/0-tools-modules';
import * as bibparser from '@retorquere/bibtex-parser';
import * as readline from 'readline';
import { existsSync } from 'fs';
import { readFile, rm } from 'fs/promises';
import { join } from 'path';
import { BiblIOAuthor, BiblIOData, BiblIODate, BiblIOIder } from './biblio-data';
import { obaconfig, filesys } from 'src/oba-base/0-oba-modules';
import { createReadStream } from 'fs';
import { statusbar } from 'src/services-base/0-servises-modules';

interface BibTexData {
    comments?: any[],
    entries?: any[],
    errors?: any[],
    jabref?: any,
    preamble?: any,
    string?: any,
}


/*
    Allow using local .bib files as sources of bibliography data. 
*/ 

// DOING/ Cache all in ram too
let MERGED_BIBLIO: BiblIOData[];

export function onload() {
    
    console.log("LocalBibsBase:onload");

    MERGED_BIBLIO = [];
    DOI_IDX_MAP = {};
    CITEKEY_IDX_MAP = {};

}

// MARK: biblio
export async function getBiblIO(ider: BiblIOIder) {
    if (ider["doi"]) {
        return await findByDoi(ider["doi"])
    } else if (ider["citekey"]) {
        return await findByCiteKey(ider["citekey"])
    } else {
        return null
    }
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
        "references-map": extractReferencesMap(lb_data),
        "extras": extractExtras(lb_data),
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
            obaconfig.getObaConfig("local.bib.files")
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
            obaconfig.getObaConfig("local.bib.files")
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
    // const lb_data = await parseBibFileFullFile(sourceFile)
    const lb_data = await parseBibFileStream(sourceFile)
    if (!lb_data) { return; }
    // Write cache
    await tools.writeJsonFileAsync(cacheFile, lb_data);
    return "parsed";
}

export async function getLocalBib(
        sourceFile: string,
        cacheFile: string = _getJSONCachePath(sourceFile)
    ) {
    await parseOnDemandLocalBib(sourceFile, cacheFile)
    return await tools.loadJsonFileAsync(cacheFile);
}

// MARK: ram cache
export function clearRAMCache() {
    MERGED_BIBLIO = [];
    DOI_IDX_MAP = {};
    CITEKEY_IDX_MAP = {};
}

async function _validateRAMCache(
    sourceFiles: string[] = obaconfig.getObaConfig("local.bib.files"),
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
    return filesys.getObaDir("localbibs")
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

function extractReferencesMap(lb_data: any): null {
    return null
}

function extractExtras(lb_data: any): any {
    return { 
        "flags.localbibs": true,
        // "localbib.data": lb_data 
    }
}

// MARK utils
export function isLocal(biblIO: BiblIOData) {
    return biblIO?.["extras"]?.["flags.localbibs"] === true
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

let DOI_IDX_MAP: { [key: string]: number };
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

let CITEKEY_IDX_MAP: { [key: string]: number };
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


// MARK: parse
async function _parseBibFileStream(
    filePath: string, 
    onEntry: (entry: any) => void
): Promise<void> {
    return new Promise((resolve, reject) => {
        let bibtexContent = '';
        let chunck: string[] = []
        const stream = createReadStream(filePath);
        const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

        rl.on('line', (line) => {
            // bibtexContent += line + '\n';
            chunck.push(line)
            if (line.trim() === '}') { // Likely end of an entry
                try {
                    bibtexContent = chunck.join('\n')
                    const parsedEntry = bibparser.parseAsync(bibtexContent);
                    onEntry(parsedEntry);
                    // bibtexContent = ''; // Reset for the next entry
                    chunck = [] as string[] // Reset for the next entry
                } catch (error) {
                    console.error('Error parsing BibTeX entry:', error);
                }
            }
        });

        rl.on('close', () => resolve());
        rl.on('error', (error: any) => reject(error));
    });
}


export async function parseBibFileStream(
    filePath: string
) {
    let parsed = 1
    const lb_data: BibTexData = {
        "comments": [],
        "entries": [],
        "errors": [],
    };
    const comments0 = lb_data['comments']
    const entries0 = lb_data['entries']
    const errors0 = lb_data['errors']
    
    statusbar.setText(`parsing bibtex`, 5)
    await _parseBibFileStream(
        filePath, 
        async (bibDataPromise: any) => {

            const bibData = await bibDataPromise
            statusbar.setText(`parsed ${parsed} entries!`, -1)
            const entries = bibData?.['entries']
            if (entries) { entries0.push(...entries) } 
            const comments = bibData?.['comments']
            if (comments) { comments0.push(...comments) } 
            const errors = bibData?.['errors']
            if (errors) { errors0.push(...errors) } 
            parsed++;
        }
    )
    statusbar.clear()
    return lb_data
}

// 
export async function parseBibFileFullFile(sourceFile: string) {
    try {
        const bibContent = await readFile(sourceFile, 'utf-8');
        const parsedBib = await bibparser.parseAsync(bibContent);
        return parsedBib;
    } catch (error) {
        console.error('Error reading or parsing .bib file:', error);
        throw error;
    }
}
