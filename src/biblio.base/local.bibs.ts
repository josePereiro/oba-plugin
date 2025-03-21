// DeepSeek
import ObA from '../main';
import { parse } from '@retorquere/bibtex-parser';
import { existsSync, mkdirSync } from 'fs';
import { readFile } from 'fs/promises';
import Fuse from 'fuse.js';
import { join } from 'path';
import { LocalBibsBase } from './local.bibs.base';


/*
    Allow using local .bib files as sources of bibliography data. 
*/ 
export class LocalBibs extends LocalBibsBase {

    constructor(oba: ObA) {
        super(oba);
        
        console.log("LocalBibs:constructor");

        // this.oba.addCommand({
        //     id: "load-bib",
        //     name: "Load local .bib",
        //     callback: async () => {
        //         const ret = await this.getLocalBib();
        //         console.log(ret);
        //     },
        // });

        this.oba.addCommand({
            id: "LocalBibs-dev",
            name: "LocalBibs-dev",
            callback: async () => {
                console.clear();
                const lb_data = await this.getLocalBib();
                console.log("lb_data");
                console.log(lb_data);
                const blibioDB = await this.getBiblioDB()
                console.log("blibioDB");
                console.log(blibioDB);
            },
        });
    }

    // // MARK: find
    // async findByDoi({
    //     doi = "",
    //     objList = athis.getLocalBib(),
    // } : {
    //     doi?: string 
    //     objList?: any[] | Promise<any[]>
    // }
    // ) {
    //     return this.oba.tools.findStr({
    //         str0: doi,
    //         keys: ["doi", "Doi", "DOI"],
    //         objList: await objList,
    //         getEntry: (entry) => {
    //             return entry?.['fields'] 
    //         },
    //         foundFun: (str0: string, str1: string) => {
    //             return this.oba.tools.hasSuffix(str0, str1);
    //         }
    //     })
    // }

    // async findById(citekey: string) {
    //     return this.oba.tools.findStr({
    //         str0: citekey,
    //         keys: ["key", "Key", "KEY"],
    //         objList: await this.getLocalBib(),
    //         foundFun: (str0: string, str1: string) => {
    //             return this.oba.tools.hasSuffix(str0, str1);
    //         }
    //     })
    // }

    // // MARK: get
    // async getLocalBib() {
    //     const bibfiles = this.oba.configfile.getConfig("local.bib.files")

    //     const rawBib = [];
    //     for (const bibfile of bibfiles) {
    //         const bibcache = this.getCachePath(bibfile)
    //         console.log("bibcache");
    //         console.log(bibcache);

    //         const newest = this.oba.tools.newestMTime(bibfile, bibcache);
    //         let bibdb = null;
    //         if (newest == '' || newest != bibcache) {
    //             // update cache
    //             bibdb = await this._parseBibFile(bibfile)
    //             console.log("bibdb");
    //             console.log(bibdb);
    //             // write cache
    //             this.oba.tools.writeJSON(bibcache, bibdb);
    //         } else {
    //             bibdb = this._loadBibCache(bibcache);
    //         }
    //         // merge
    //         const entries = bibdb?.['entries'];
    //         if (!entries) { continue; } 
    //         for (const elm of entries) {
    //             rawBib.push(elm); // Efficient for large arrays
    //         }
    //     }
    //     return rawBib
    // }

    // getBibTexDir(): string {
    //     const obaDir = this.oba.tools.getObaDir();
    //     const _dir = join(obaDir, "localbibs");
    //     if (!existsSync(_dir)) {
    //         mkdirSync(_dir, { recursive: true });
    //     }
    //     return _dir;
    // }

    // getCachePath(sourceFile: string) {
    //     console.log("sourceFile");
    //     console.log(sourceFile);
    //     const hash = this.oba.tools.hash64(sourceFile);
    //     return join(
    //         this.getBibTexDir(),
    //         `${hash}.cache.bib.json`
    //     )
    // }

    // // MARK: extract
    // extractDoi(bib_entry: any) {
    //     const fields = this.oba.tools.getFirst(bib_entry, 
    //         ['fields', 'Fields', 'FIELDS']
    //     )
    //     const doi = this.oba.tools.getFirst(fields, 
    //         ["doi", "Doi", "DOI"]
    //     )
    //     return this.oba.tools.absDoi(doi);
    // }

    // extractCiteKey(entry: any) {
    //     return this.oba.tools.getFirst(entry, 
    //         ["key", "Key", "KEY"]
    //     )
    // }

    // extractDate(entry: any) {
    //     const fields = this.oba.tools.getFirst(entry, 
    //         ['fields', 'Fields', 'FIELDS']
    //     )
    //     return this.oba.tools.getFirst(fields, 
    //         ["date", "Date", "DATE"]
    //     )
    // }

    // extractTitle(entry: any) {
    //     const fields = this.oba.tools.getFirst(entry, 
    //         ['fields', 'Fields', 'FIELDS']
    //     )
    //     return this.oba.tools.getFirst(fields, 
    //         ["title", "Title", "TITLE"]
    //     )
    // }

    // extractKeywords(entry: any) {
    //     const fields = this.oba.tools.getFirst(entry, 
    //         ['fields', 'Fields', 'FIELDS']
    //     )
    //     return this.oba.tools.getFirst(fields, 
    //         ["keywords", "Keywords", "KEYWORDS"]
    //     )
    // }

    // extractBIBText(entry: any) {
    //     return this.oba.tools.getFirst(entry, 
    //         ["input", "Input", "INPUT"]
    //     )
    // }

    // extractType(entry: any) {
    //     return this.oba.tools.getFirst(entry, 
    //         ["type", "Type", "TYPE"]
    //     )
    // }

    // // MARK: load
    // async _loadBibCache(filePath: string) {
    //     return await this.oba.tools.loadJSON(filePath);
    // }

    // async _parseBibFile(filePath: string) {
    //     try {
    //         // Read the .bib file
    //         const bibContent = await readFile(filePath, 'utf-8');
    //         // Parse the .bib content into JSON
    //         // const parsedBib = BibtexParser.parseToJSON(bibContent);
    //         const parsedBib = parse(bibContent);
    //         return parsedBib;

    //     } catch (error) {
    //         console.error('Error reading or parsing .bib file:', error);
    //         throw error;
    //     }
    // }

    // // MARK: utils
    // async fussySearch(hint: string) {
    //     const entries = await this.getLocalBib();
    //     // TODO: integrate with this.oba.config
    //     const options = {
    //         keys: [
    //             'input', 'key', 
    //             'fields.author',
    //             'fields.author.lastName',
    //             'fields.author.firstName',
    //             'fields.date',
    //             'fields.doi',
    //             'fields.title',
    //         ], // Fields to search in
    //         threshold: 0.4, // Adjust matching sensitivity
    //     };
    //     const fuse = new Fuse(entries, options);
    //     return fuse.search(hint);
    // }
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