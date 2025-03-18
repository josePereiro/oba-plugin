import { Notice } from 'obsidian';
import ObA from './main';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

// TODO: Make a command for downloading (caching)
// The refs for all entries at bibtex

/*
    Use CrossRef API to download papers metadata
*/
export class CrossRef {

    constructor(private oba: ObA) {
        console.log("CrossRef:constructor");

        // MARK: Commands
        this.oba.addCommand({
            id: "CrossRef-dev",
            name: "CrossRef dev",
            callback: async () => {
                console.clear();
                const sel = this.oba.tools.getSelectedText();
                console.log(sel);
                const data = await this._fetchCrossrefData(sel)
                console.log(data);
            },
        });

        this.oba.addCommand({
            id: 'oba-crossref-fetch-all',
            name: 'Crossref fetch all bibtex',
            callback: async () => {
                console.clear();
                await this.downloadAll()
            }
        });
    }

    // TODO: Test this
    async downloadAll() {
        const entries = await this.oba.localbibs.getLocalBib();
        console.log("entries");
        console.log(entries);
        for (const entry of entries) {
            console.log("entry");
            console.log(entry);
            const doi = this.oba.tools.getFirst(entry?.["fields"], 
                ["doi", "DOI", "Doi"]
            )
            const crossref = await this.getCrossrefData(doi);
            console.log("crossref");
            console.log(crossref);
            this.oba.tools.sleep(100);
        }
    }

    extractReferences(data: any) {
        return data?.['message']?.['reference']
    }
    extractCiteKey(data: any) {
        return data?.['key']
    }

    getCrossrefDir(): string {
        const obaDir = this.oba.tools.getObaDir();
        const _dir = join(obaDir, "crossref");
        if (!existsSync(_dir)) {
            mkdirSync(_dir, { recursive: true });
        }
        return _dir;
    }

    async getCrossrefData(doi: string) {
        let data;
        data = this._loadCrossrefCache(doi);
        if (data) {
            console.log('cache found!')
        } else {
            console.log('cache missed. fetching!')
            data = await this._fetchCrossrefData(doi)
            // store in cache
            if (data) { this.writeCache(doi, data); } 
        }
        return data
    }

    async getReferencesData(doi: string) {
        const data = await this.getCrossrefData(doi);
        return this.extractReferences(data)
    }

    _loadCrossrefCache(doi: string) {
        return this.oba.tools.loadJSON(this.cachePath(doi));
    }

    async _fetchCrossrefData(doi: string) {
        try {
            new Notice('Sending request');
            const url = `https://api.crossref.org/works/${doi}`;
            const response = await fetch(url);
            console.log('_fetchCrossrefData.response ', response)
            if (!response?.['ok']) {
                new Notice(`Server error, check selected doi.\ndoi: ${doi}`);
                return null
            }
            const data = await response.json();
            console.log('_fetchCrossrefData.data ', data)
            return data
        } catch (error) {
            console.error('Error fetching DOI reference:', error);
            new Notice(`Server error, check selected doi. ${doi}`);
            return null
        }
    }

    writeCache(url: string, cache) {
        return this.oba.tools.writeJSON(this.cachePath(url), cache);
    }

    hasCache(doi: string) {
        const path = this.cachePath(doi)
        return existsSync(path)
    }

    cachePath(doi: string): string {
        return join(
            this.getCrossrefDir(),
            this.oba.tools.uriToFilename(doi)
        )
    }

    // async promptForDoi() {
    //     const doi = await this.oba.app.workspace.activeEditor?.editor?.getSelection() || prompt('Enter the DOI:');
    //     return doi?.trim();
    // }

}

