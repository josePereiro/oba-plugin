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

        // Commands
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
            id: 'oba-crossref-search-cmd',
            name: 'Crossref copy references',
            callback: () => {
                console.clear();
                this.copyDoiReferences()
            }
        });

        this.oba.addCommand({
            id: 'oba-crossref-fetch-all',
            name: 'Crossref fetch all bibtex',
            callback: () => {
                console.clear();
                this.downloadAll()
            }
        });
    }

    // TODO: Test this make it 
    async downloadAll() {
        const entries = this.oba.bibtex.getLocalBib();
        for (const entry of entries) {
            const doi = this.oba.tools.getFirst(entry?.["fields"], 
                ["doi", "DOI", "Doi"]
            )
            await this.getCrossrefData(doi);
            this.oba.tools.sleep(100);
        }
    }

    async copyDoiReferences() {
        // const doi = await this.promptForDoi();
        // const doi = "https://doi.org/10.1038/srep45303";
        const doi = this.oba.tools.getSelectedText()
        if (!doi) {
            new Notice('Select a doi');
            return;
        }
        
        // check cache
        const data = await this.getCrossrefData(doi)
        console.log("data")
        console.log(data)

        // Process data
        const msg = data?.['message']
        console.log("msg")
        console.log(msg)
        if (!msg) {
            console.error('message missing');
            return;
        }

        console.log('reference-count');
        console.log(msg['reference-count'] ?? msg['references-count'] ?? 'missing');

        const refobjs = msg['reference'] ?? null
        if (!refobjs) {
            console.log('refobjs missing')
            new Notice(`Sorry, references missing.\ndoi: ${doi}`);
            return;
        }

        const refcites = [];
        const bib_entries = this.oba.bibtex.getLocalBib()

        for (let i = 0; i < refobjs.length; i++) {

            let _ref_str = `[${i + 1}]`;
            const __doi = refobjs?.[i]?.['DOI'] ?? refobjs?.[i]?.['doi'] ?? '';
            const _doi = this.formatDoi(__doi);
            
            // search citekey in bibtex
            let _citekey = '';
            const _entry = this.oba.bibtex.findByDoi(_doi, bib_entries);
            if (_entry) {
                _citekey = _entry?.["key"] ?? ''
                _citekey = "@" + _citekey
            }
            if (_citekey) { _ref_str += ` [[${_citekey}]]`; }

            if (_doi) { _ref_str += ` ${_doi}`; }
            const _year = refobjs[i]['year'] ?? '';
            if (_year) { _ref_str += ` (${_year})`; }
            const _cite = refobjs[i]['unstructured'] ?? 'missing';
            _ref_str += ` ${_cite}`
            
            console.log(_ref_str);
            refcites.push(_ref_str);
        }

        const reference_section = refcites.join('\n\n');
        this.oba.tools.copyToClipboard(reference_section);

        new Notice(`SUCESS!!! Reference copied to clipboard.\ndoi: ${doi}`)
    }

    async getReferences(url: string) {
        const data = await this.getCrossrefData(url)
        return data?.['message']?.['reference']
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
        if (!data) {
            data = await this._fetchCrossrefData(doi)
            // store in cache
            if (data) { this.writeCache(doi, data); } 
        }
        return data
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

    formatDoi(doi: string): string {
        if (doi == '') {
            return ''
        }
        if (!doi.startsWith('https://doi.org/')) {
            // Add the prefix
            return 'https://doi.org/' + doi;
        }
        return doi
    }

    async promptForDoi() {
        const doi = await this.oba.app.workspace.activeEditor?.editor?.getSelection() || prompt('Enter the DOI:');
        return doi?.trim();
    }

}

