// DeepSeek
import ObA from './main';
import { parse } from '@retorquere/bibtex-parser';
import { existsSync, mkdirSync } from 'fs';
import { readFile } from 'fs/promises';
import Fuse from 'fuse.js';
import { join } from 'path';


/*
    Manage a .bib database
    #TODO: rename 
    #TODO: Add multiple source support
    #TODO/DONE: Add automatic recache if source is updated
*/
export class BibTex {

    constructor(private oba: ObA) {
        console.log("BibTex:constructor");

        this.oba.addCommand({
            id: "load-bib",
            name: "Load local .bib",
            callback: async () => {
                const ret = await this.getLocalBib();
                console.log(ret);
            },
        });

        this.oba.addCommand({
            id: "BibTex-dev",
            name: "BibTex-dev",
            callback: async () => {
                console.clear();
            },
        });
    }

    _loadBibCache(filePath: string) {
        return this.oba.tools.loadJSON(filePath);
    }

    // MARK: copyReferenceLink
    async getLocalBib() {
        const bibfiles = this.oba.configfile.getConfig("local.bib.files")

        const rawBib = [];
        for (const bibfile of bibfiles) {
            const bibcache = this.cachePath(bibfile)
            console.log("bibcache");
            console.log(bibcache);

            const newest = this.oba.tools.getMoreRecentlyModified(bibfile, bibcache);
            let bibdb = null;
            if (newest == '' || newest != bibcache) {
                // update cache
                bibdb = await this._parseBibFile(bibfile)
                console.log("bibdb");
                console.log(bibdb);
                // write cache
                this.oba.tools.writeJSON(bibcache, bibdb);
            } else {
                bibdb = this._loadBibCache(bibcache);
            }
            // merge
            const entries = bibdb?.['entries'];
            if (!entries) { continue; } 
            for (const elm of entries) {
                rawBib.push(elm); // Efficient for large arrays
            }
        }
        return rawBib
    }

    async findByDoi({
        doi = "",
        objList = [],
    } : {
        doi?: string 
        objList?: any[]
    }
    ) {
        return this.oba.tools.findStr({
            str0: doi,
            keys: ["doi", "Doi", "DOI"],
            objList: objList,
            getEntry: (entry) => {
                return entry?.['fields'] 
            },
            foundFun: (str0: string, str1: string) => {
                return this.oba.tools.hasSuffix(str0, str1);
            }
        })
    }

    async findById(citekey: string) {
        return this.oba.tools.findStr({
            str0: citekey,
            keys: ["key", "Key", "KEY"],
            objList: await this.getLocalBib(),
            foundFun: (str0: string, str1: string) => {
                return this.oba.tools.hasSuffix(str0, str1);
            }
        })
    }

    async _parseBibFile(filePath: string) {
        try {
            // Read the .bib file
            const bibContent = await readFile(filePath, 'utf-8');
            // Parse the .bib content into JSON
            // const parsedBib = BibtexParser.parseToJSON(bibContent);
            const parsedBib = parse(bibContent);
            return parsedBib;

        } catch (error) {
            console.error('Error reading or parsing .bib file:', error);
            throw error;
        }
    }

    getBibTexDir(): string {
        const obaDir = this.oba.tools.getObaDir();
        const _dir = join(obaDir, "bibtex");
        if (!existsSync(_dir)) {
            mkdirSync(_dir, { recursive: true });
        }
        return _dir;
    }

    cachePath(sourceFile: string) {
        console.log("sourceFile");
        console.log(sourceFile);
        const hash = this.oba.tools.hash64(sourceFile);
        return join(
            this.getBibTexDir(),
            `${hash}.cache.bib.json`
        )
    }

    async fussySearch(hint: string) {
        const entries = await this.getLocalBib();
        // TODO: integrate with this.oba.config
        const options = {
            keys: [
                'input', 'key', 
                'fields.author',
                'fields.author.lastName',
                'fields.author.firstName',
                'fields.date',
                'fields.doi',
                'fields.title',
            ], // Fields to search in
            threshold: 0.4, // Adjust matching sensitivity
        };
        const fuse = new Fuse(entries, options);
        return fuse.search(hint);
    }

    extractDoi(entry: any) {
        console.log("entry:\n", entry);
        const fields = this.oba.tools.getFirst(entry, 
            ['fields', 'Fields', 'FIELDS']
        )
        console.log("fields:\n", fields);
        return this.oba.tools.getFirst(fields, 
            ["doi", "Doi", "DOI"]
        )
    }

    extractCiteKey(entry: any) {
        return this.oba.tools.getFirst(entry, 
            ["key", "Key", "KEY"]
        )
    }

    extractDate(entry: any) {
        const fields = this.oba.tools.getFirst(entry, 
            ['fields', 'Fields', 'FIELDS']
        )
        return this.oba.tools.getFirst(fields, 
            ["date", "Date", "DATE"]
        )
    }

    extractTitle(entry: any) {
        const fields = this.oba.tools.getFirst(entry, 
            ['fields', 'Fields', 'FIELDS']
        )
        return this.oba.tools.getFirst(fields, 
            ["title", "Title", "TITLE"]
        )
    }

    extractKeywords(entry: any) {
        const fields = this.oba.tools.getFirst(entry, 
            ['fields', 'Fields', 'FIELDS']
        )
        return this.oba.tools.getFirst(fields, 
            ["keywords", "Keywords", "KEYWORDS"]
        )
    }

    extractBIBText(entry: any) {
        return this.oba.tools.getFirst(entry, 
            ["input", "Input", "INPUT"]
        )
    }

    extractType(entry: any) {
        return this.oba.tools.getFirst(entry, 
            ["type", "Type", "TYPE"]
        )
    }
}