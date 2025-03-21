// DeepSeek
import ObA from '../main';
import { parse } from '@retorquere/bibtex-parser';
import { existsSync, mkdirSync } from 'fs';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { BiblIOAuthor, BiblIOData, BiblIODate } from './bibl.io.data';


/*
    Allow using local .bib files as sources of bibliography data. 
*/ 
export class LocalBibsBase {

    constructor(public oba: ObA) {
        console.log("LocalBibs:constructor");
    }

    // MARK: biblio
        async getBiblioDB(
            sourceFiles: string[] = 
                this.oba.configfile.getConfig("local.bib.files")
        ) {
            const biblioDB: BiblIOData[] = [];
            const lb_dataDB = await this.getLocalBib(sourceFiles)
            for (const lb_data of lb_dataDB) {
                const biblio: BiblIOData = {
                    "doi": this.extractDoi(lb_data),
                    "citekey": this.extractCiteKey(lb_data),
                    "type": this.extractType(lb_data),
                    "title": this.extractTitle(lb_data),
                    "authors": this.extractAuthors(lb_data),
                    "created-date": this.extractCreatedDate(lb_data),
                    "deposited-date": this.extractDepositedDate(lb_data),
                    "issued-date": this.extractIssuedDate(lb_data),
                    "published-date": this.extractPublishedDate(lb_data),
                    "journaltitle": this.extractJournalTitle(lb_data),
                    "url": this.extractURL(lb_data),
                    "abstract": this.extractAbstract(lb_data),
                    "keywords": this.extractKeywords(lb_data),
                    "references-count": this.extractReferencesCount(lb_data),
                    "references-DOIs": this.extractReferencesDOIs(lb_data),
                    "extras": this.extractExtras(lb_data),
                }
                biblioDB.push(biblio);
            }
            return biblioDB
        }

    // MARK: parse/load
    async _parseBibFile(sourceFile: string) {
        try {
            const bibContent = await readFile(sourceFile, 'utf-8');
            const parsedBib = parse(bibContent);
            return parsedBib;
        } catch (error) {
            console.error('Error reading or parsing .bib file:', error);
            throw error;
        }
    }

    async _parseOnDemandLocalBib(sourceFile: string) {
        // Check file
        const cacheFile = this._getCachePath(sourceFile)
        const newest = this.oba.tools.newestMTime(sourceFile, cacheFile);
        if (existsSync(cacheFile) && newest == cacheFile) { 
            console.log(`cached! ${sourceFile}`)
            return; 
        }
        // parse/catch
        console.log(`parsing! ${sourceFile}`)
        const lb_data = await this._parseBibFile(sourceFile)
        if (!lb_data) { return; }
        return this.oba.tools.writeJSON(cacheFile, lb_data);
    }

    async parseOnDemandLocalBib(sourceFile: string) {
        await this._parseOnDemandLocalBib(sourceFile)
    }

    async getLocalBib(
        sourceFiles: string[] = 
            this.oba.configfile.getConfig("local.bib.files")
    ) {
        const lb_merged = [];
        for (const sourceFile of sourceFiles) {
            // load
            await this._parseOnDemandLocalBib(sourceFile);
            const lb_data = await this._loadBibCache(sourceFile);
            // merge
            const entries = lb_data?.['entries'];
            if (!entries) { continue; } 
            for (const elm of entries) { lb_merged.push(elm); }
        }
        return lb_merged
    }


    // MARK: extract
    // All extract methods must return null if failed
    private extractDoi(lb_data: any): string | null {
        try {
            const dat0 = lb_data["fields"]["doi"]
            if (!dat0) { return null; } 
            return this.oba.tools.absDoi(dat0);
        } catch (error) { return null; }
    }

    private extractCiteKey(lb_data: any): null {
        try {
            const dat0 = lb_data["key"]
            if (!dat0) { return null; } 
            return dat0
        } catch (error) { return null; }
    }

    private extractType(lb_data: any): string | null {
        try {
            const dat0 = lb_data["type"]
            if (!dat0) { return null; } 
            return dat0
        } catch (error) { return null; }
    }

    private extractTitle(lb_data: any): string | null {
        try{
            const dat0 = lb_data["fields"]['title']
            if (!dat0) { return null}
            return dat0
        } catch (error) { return null; }
    }

    private extractAuthors(lb_data: any): BiblIOAuthor[] | null {
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

    private extractCreatedDate(lb_data: any): BiblIODate | null {
        return null
    }

    private extractDepositedDate(lb_data: any): BiblIODate | null {
        return null
    }

    private extractIssuedDate(lb_data: any): BiblIODate | null {
        return null
    }

    private extractPublishedDate(lb_data: any): BiblIODate | null {
        try {
            const dat0 = lb_data["fields"]["date"]
            const dat1 = dat0.split("-")
            console.log(dat1)
            const date: BiblIODate = {
                "year": this._number(dat1[0]),
                "month": this._number(dat1?.[1]),
                "day": this._number(dat1?.[2]),
            }
            return date
        } catch (error) { 
            // console.log(error)
            return null; 
        }
    }   

    private extractJournalTitle(lb_data: any): string | null {
        try {
            const dat0 = lb_data["fields"]["journaltitle"]
            if (!dat0) { return null}
            return dat0
        } catch (error) { return null; }
    }

    private extractURL(lb_data: any): string | null {
        try {
            const dat0 = lb_data["fields"]["url"]
            if (!dat0) { return null}
            return dat0
        } catch (error) { return null; }
    }

    private extractAbstract(lb_data: any): string | null {
        try {
            const dat0 = lb_data["fields"]["abstract"]
            if (!dat0) { return null}
            return dat0
        } catch (error) { return null; }
    }

    private extractKeywords(lb_data: any): string[] | null {
        try {
            const dat0 = lb_data["fields"]["keywords"]
            if (!dat0) { return null}
            return dat0
        } catch (error) { return null; }
    }

    private extractReferencesCount(lb_data: any): null {
        return null
    }

    private extractReferencesDOIs(lb_data: any): null {
        return null
    }

    private extractExtras(lb_data: any): any {
        return { "localbib": lb_data }
    }

    // MARK: cache

    getBibTexDir(): string {
        const obaDir = this.oba.tools.getObaDir();
        const _dir = join(obaDir, "localbibs");
        if (!existsSync(_dir)) {
            mkdirSync(_dir, { recursive: true });
        }
        return _dir;
    }

    _hasCache(sourceFile: string) {
        const path = this._getCachePath(sourceFile)
        return existsSync(path)
    }

    _getCachePath(sourceFile: string) {
        console.log("sourceFile");
        console.log(sourceFile);
        const hash = this.oba.tools.hash64(sourceFile);
        return join(
            this.getBibTexDir(),
            `${hash}.cache.bib.json`
        )
    }

    async _loadBibCache(sourceFile: string) {
        const path = this._getCachePath(sourceFile)
        return await this.oba.tools.loadJSON(path);
    }

    _writeCache(sourceFile: string, lb_data: any) {
        const path = this._getCachePath(sourceFile);
        return this.oba.tools.writeJSON(path, lb_data);
    }

    // MARK: Utils
    _number(str0: string) {
        const str = str0.trim();
        if (!str) { return null; }
        return Number(str)
    }


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