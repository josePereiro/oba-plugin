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

    // MARK: constructor
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
            id: 'oba-CitationNotes-copy-bibless-reference-current-note',
            name: 'CitationNotes copy bibless references of current note',
            callback: async () => {
                console.clear();
                const doi = await this.getBibTexDoi();
                if (!doi) {
                    new Notice('Missing doi');
                    return;
                }
                await this.copyBiblessReferences(doi);
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

    // MARK: copy
    async copyDoiReferences(doi: string) {
        
        const ref_strings: string[] = [];
        const lb_entries = await this.oba.localbibs.getLocalBib();

        this.oba.crossref.forEachReferenceData(doi, 
            async (cr_data, refi) => {
                const _doi = this.oba.crossref.extractReferenceDoi(cr_data, refi)
                // TODO/DOING Fix this
                const cr_data1 = await this.oba.crossref.getCrossrefData(_doi)

                // this.oba.crossref.extractTitle

                console.log("_citekey: ", _citekey)
                const _year = refobjs[i]['year'] ?? '';
                console.log("_year: ", _year)
                const _cite = refobjs[i]['unstructured'] ?? '';
                console.log("_cite: ", _cite)

                
                // search citekey from local bibtex
                const lb_entry = await this.oba.localbibs.findByDoi({
                    doi: _doi, 
                    objList: lb_entries
                });
                const _citekey = this.oba.localbibs.extractCiteKey(lb_entry);

                
                let _ref_str = `> [${refi + 1}]  `;
                if (_citekey) { _ref_str += `[[@${_citekey}]] `; }
                if (_doi) { _ref_str += `${_doi} `; }
                if (_year) { _ref_str += `(${_year}) `; }
                _ref_str += `${_cite} `
                
                ref_strings.push(_ref_str);
            }
        )

        const reference_section = ref_strings.join('\n');
        this.oba.tools.copyToClipboard(reference_section);

        new Notice(`SUCESS!!! Reference copied to clipboard.\ndoi: ${doi}`)
    }

    async copyBiblessReferences(doi: string) {

        const dois: string[] = [];
        const lb_entries = await this.oba.localbibs.getLocalBib();

        this.oba.crossref.forEachReferenceData(doi, 
            async (cr_data, refi) => {
                const _doi = this.oba.crossref.extractReferenceDoi(cr_data, refi)
                if (!_doi) { return; }
                // search citekey from local bibtex
                const lb_entry = await this.oba.localbibs.findByDoi({
                    doi: _doi, 
                    objList: lb_entries
                });
                if (lb_entry) { return; }
                dois.push(_doi);
            }
        )

        const reference_section = dois.join('\n');
        this.oba.tools.copyToClipboard(reference_section);

        new Notice(`SUCESS!!! DOIs copied to clipboard`)
    }

    // async copyTitle(citekey: string) {
    //     this.oba.
    // }

    async copyReferenceLink(refnum: number, 
        note: TFile = this.oba.tools.getCurrNote()
    ) {
        this.oba.tools.copyToClipboard("");
        let doi0 = await this.getBibTexDoi(note);
        doi0 = this.oba.tools.absDoi(doi0);
        console.log('doi0: ', doi0)
        const cr_data = await this.oba.crossref.getCrossrefData(doi0);
        console.log('cr_data: ', cr_data)
        const doi1 = this.oba.crossref.extractReferenceDoi(cr_data, refnum-1)
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
            new Notice(`🚨 ERROR: Missing at Local Bibtex, doi ${doi1}`)
            const doi2 = this.oba.tools.absDoi(doi1);
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

    // MARK: extract
    // TODO/TAI: do not rely on the note name
    // - Maybe add a citekey field on the yalm section of the note
    extractCiteKey(note: TFile = this.oba.tools.getCurrNote()) {
        return note?.basename?.
            replace(/\.md$/, '')?.
            replace(/^@/, '')
    }

    // MARK: get
    async getBibTex(note: TFile = this.oba.tools.getCurrNote()) {
        const citekey = this.extractCiteKey(note);
        const entry = await this.oba.localbibs.findById(citekey);
        return entry
    }

    async getBibTexDoi(note: TFile = this.oba.tools.getCurrNote()) {
        const entry = await this.getBibTex(note);
        return this.oba.localbibs.extractDoi(entry);
    }

    /*
        search in both local and bibtex
    */ 
    async search2Title(doi0: string) {
        const doi = this.oba.tools.absDoi(doi0);
        // first search at local bibtex
        const lb_entry = this.oba.localbibs.findByDoi({doi});
        if (lb_entry) {
            return this.oba.localbibs.extractTitle(lb_entry)
        }
        // fetch using crossref
        const cr_entry = this.oba.crossref.getCrossrefData(doi)
        if (cr_entry) {
            return this.oba.crossref.extractTitle(cr_entry)
        }
    }

}