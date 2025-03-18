import { Notice, TFile } from 'obsidian';
import ObA from './main';

/*
    Handle citation notes.
    - parse metadata from citation notes
        - keep a cache of such metadata
    - Notify when format is invalid
    - Replacements
        - Replace #!REF13 by the citekey if it is present in the bibtex db
            - Use crossref for getting References
*/
export class CitationNotes {

    constructor(private oba: ObA) {
        console.log("CitationNotes:constructor");
        
        this.oba.addCommand({
            id: "CitationNotes-dev",
            name: "CitationNotes dev",
            callback: async () => {
                console.clear();
            },
        });

        this.oba.addCommand({
            id: 'oba-CitationNotes-copy-reference-selected-doi',
            name: 'CitationNotes copy references of selected doi',
            callback: async () => {
                console.clear();
                const doi = this.oba.tools.getSelectedText()
                if (!doi) {
                    new Notice('Select a doi');
                    return;
                }
                await this.copyDoiReferences(doi);
            }
        });
        
        this.oba.addCommand({
            id: 'oba-CitationNotes-copy-reference-current-note',
            name: 'CitationNotes copy references of current note',
            callback: async () => {
                console.clear();
                const doi = await this.getBibTexDoi();
                if (!doi) {
                    new Notice('Missing doi');
                    return;
                }
                await this.copyDoiReferences(doi);
            }
        });
        
        this.oba.addCommand({
            id: "CitationNotes-copy-link-selected-reference",
            name: "CitationNotes copy link of selected reference",
            callback: async () => {
                console.clear();
                const str = this.oba.tools.getSelectedText().
                    replace(/\D+/g, "")
                const refnum = parseInt(str);
                const note = this.oba.tools.getCurrNote()
                await this.copyReferenceLink(refnum,  note)
            }
        });

    }

    // TODO: move to citation.notes
    async copyDoiReferences(doi: string) {
        
        const refobjs = await this.oba.crossref.getReferencesData(doi);
        if (!refobjs) {
            console.error('crossref data missing')
            new Notice(`Sorry, references missing.\ndoi: ${doi}`);
            return;
        }

        const refcites = [];
        const bib_entries = await this.oba.localbibs.getLocalBib();

        for (let i = 0; i < refobjs.length; i++) {

            let _ref_str = `> [${i + 1}]  `;
            const _doi = this.oba.crossref.extractDoi(refobjs?.[i]);
            
            // search citekey from local bibtex
            const _entry = await this.oba.localbibs.findByDoi({
                doi: _doi, 
                objList: bib_entries
            });
            const _citekey = this.oba.localbibs.extractCiteKey(_entry);
            console.log("_citekey: ", _citekey)
            if (_citekey) { _ref_str += `[[@${_citekey}]] `; }

            if (_doi) { _ref_str += `${_doi} `; }
            const _year = refobjs[i]['year'] ?? '';
            if (_year) { _ref_str += `(${_year}) `; }
            const _cite = refobjs[i]['unstructured'] ?? '';
            _ref_str += `${_cite} `
            
            console.log(_ref_str);
            refcites.push(_ref_str);
        }

        const reference_section = refcites.join('\n');
        this.oba.tools.copyToClipboard(reference_section);

        new Notice(`SUCESS!!! Reference copied to clipboard.\ndoi: ${doi}`)
    }

    async copyBiblessReferences(doi: string) {
        const refobjs = await this.oba.crossref.getReferencesData(doi);
        if (!refobjs) {
            console.error('crossref data missing')
            new Notice(`Sorry, references missing.\ndoi: ${doi}`);
            return;
        }

        const refcites = [];
        const bib_entries = await this.oba.localbibs.getLocalBib();

        for (let i = 0; i < refobjs.length; i++) {

            let _ref_str = '';
            const _doi = this.oba.localbibs.extractDoi(refobjs?.[i]);
            
            // search citekey from local bibtex
            const _entry = await this.oba.localbibs.findByDoi({
                doi: _doi, 
                objList: bib_entries
            });
            if (_entry) { continue; }

            if (_doi) { _ref_str += `${_doi} `; }
            const _year = refobjs[i]['year'] ?? '';
            if (_year) { _ref_str += `(${_year}) `; }
            const _cite = refobjs[i]['unstructured'] ?? '';
            _ref_str += `${_cite} `
            
            console.log(_ref_str);
            refcites.push(_ref_str);
        }

        const reference_section = refcites.join('\n');
        this.oba.tools.copyToClipboard(reference_section);

        new Notice(`SUCESS!!! Reference copied to clipboard.\ndoi: ${doi}`)
    }

    // Maybe move to 
    extractCiteKey(note: TFile = this.oba.tools.getCurrNote()) {
        return note?.basename?.
            replace(/\.md$/, '')?.
            replace(/^@/, '')
    }

    async getBibTex(note: TFile = this.oba.tools.getCurrNote()) {
        const citekey = this.extractCiteKey(note);
        // console.log(citekey)
        const entry = await this.oba.localbibs.findById(citekey);
        // console.log(entry)
        return entry
    }

    async getBibTexDoi(note: TFile = this.oba.tools.getCurrNote()) {
        const entry = await this.getBibTex(note);
        return this.oba.localbibs.extractDoi(entry);
    }


    // MARK: copyReferenceLink
    async copyReferenceLink(refnum: number, 
        note: TFile = this.oba.tools.getCurrNote()
    ) {
        this.oba.tools.copyToClipboard("");
        const doi0 = await this.getBibTexDoi(note);
        console.log('doi0: ', doi0)
        const crossref_refobjs = await this.oba.crossref.getReferencesData(doi0);
        console.log('crossref_refobjs: ', crossref_refobjs)
        const doi1 = 
            crossref_refobjs?.[refnum-1]?.['DOI'] ?? 
            crossref_refobjs?.[refnum-1]?.['doi']
        console.log('doi1: ', doi1)
        if (!doi1) {
            new Notice("ERROR: Missing doi")
            return
        }
        const bibtex_data = await this.oba.localbibs.findByDoi({
            doi: doi1, 
            objList: await this.oba.localbibs.getLocalBib()
        });
        if (!bibtex_data) {
            new Notice(`ERROR: Bibtex missing, doi ${doi1}`)
            const doi2 = this.oba.tools.formatDoi(doi1);
            const link = `\\[[${refnum}](${doi2})]]\\`
            this.oba.tools.copyToClipboard(link);
            new Notice(`Link copied in clipboard, link: ${link}`);
            return
        }

        console.log('bibtex_data: ', bibtex_data)
        const citekey1 = this.oba.localbibs.extractCiteKey(bibtex_data);
        console.log('citekey1: ', citekey1)
        const link = `\\[[[@${citekey1}|${refnum}]]\\]`
        console.log(link)
        this.oba.tools.copyToClipboard(link);
        new Notice(`Link copied in clipboard, link: ${link}`);
    }


}