// DeepSeek
import ObA from './main';
import { parse } from '@retorquere/bibtex-parser';
import { existsSync, mkdirSync, readFileSync } from 'fs';
import Fuse from 'fuse.js';
import { join } from 'path';



export class BibTex {

    constructor(private oba: ObA) {
        console.log("BibTex:constructor");

        this.oba.addCommand({
            id: "load-bib",
            name: "Load local .bib",
            callback: () => {
                const ret = this.getLocalBib();
                console.log(ret);
            },
        });

        this.oba.addCommand({
            id: "BibTex-dev",
            name: "BibTex-dev",
            callback: () => {
                const hint = this.oba.tools.getSelectedText();
                console.log(hint);
                // console.log(this.fussySearch(hint));
                console.log(this.findByDoi(hint));
            },
        });
    }

    _loadBibCache(filePath: string = this.cachePath()) {
        return this.oba.tools.loadJSON(filePath);
    }

    _getLocalBib() {
        const bibfile = this.oba.configfile.getConfig("local.bib.file")
        const bibcache = this.cachePath()

        const newest = this.oba.tools.getMoreRecentlyModified(bibfile, bibcache);
        if (newest != bibcache) {
            // update cache
            const parsedBib = this._parseBibFile(bibfile)
            // write cache
            this.oba.tools.writeJSON(bibcache, parsedBib);
            return parsedBib
        } else {
            return this._loadBibCache(bibcache);
        }
    }

    fussySearch(hint: string, entries = this.getLocalBib()) {

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

    findSuffix(str0: string, keys: string[], entries = this.getLocalBib()) {
        if (!str0) { return null; } 
        if (!entries) { return null }
        for (const entry of entries) {
            const str1 = this.oba.tools.getFirst(
                entry?.['fields'], 
                keys, 
            )
            if (typeof str1 !== "string") { continue; }
            if (!str1) { continue; }
            if (str0.endsWith(str1) || str1.endsWith(str0)) {
                return entry
            }
        }
        return null
    }

    findByDoi(str0: string, entries = this.getLocalBib()) {
        return this.findSuffix(str0, ["doi", "Doi", "DOI"], entries)
    }

    getLocalBib() {
        const data = this._getLocalBib();
        return data?.['entries']
    }

    _parseBibFile(filePath: string = this.cachePath()): any {
        try {
            // Read the .bib file
            const bibContent = readFileSync(filePath, 'utf-8');
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

    cachePath() {
        return join(
            this.getBibTexDir(),
            "cache.bib.json"
        )
    }
}