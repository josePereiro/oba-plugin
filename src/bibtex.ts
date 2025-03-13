// DeepSeek
import ObA from './main';
// import {BibtexParser} from "bibtex-js-parser";
import { parse } from '@retorquere/bibtex-parser';
import { existsSync, mkdirSync, readFileSync } from 'fs';
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
            id: "find-doi",
            name: "Find doi",
            callback: () => {
                const doi = this.oba.tools.getSelectedText();
                console.log(doi);
                console.log(this.findDoi(doi));
            },
        });
    }

    _loadBibCache(filePath: string = this.cachePath()) {
        return this.oba.tools.loadJSON(filePath);
    }

    _getLocalBib() {
        const bibfile = this.oba.configfile.readConfig("local.bib.file")
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

    findDoi(doi0: string, entries = this.getLocalBib()) {
        if (doi0 == '') { return null; } 
        if (!doi0) { return null; } 
        if (!entries) { return null }
        for (const entry of entries) {
            const doi1 = entry?.["fields"]?.["doi"] ?? entry?.["fields"]?.["DOI"] ?? entry?.["fields"]?.["Doi"]
            if (doi1 == '') { continue; } 
            if (!doi1) { continue; }
            if (doi0.endsWith(doi1) || doi1.endsWith(doi0)) {
                return entry
            }
        }
        return null
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