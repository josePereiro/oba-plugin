import { Notice, TFile } from 'obsidian';

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
        console.log("CitationNotes:onload");
        
        // this.oba.addCommand({
        //     id: "CitationNotes-dev",
        //     name: "CitationNotes dev",
        //     callback: async () => {
        //         console.clear();
        //     },
        // });

        // this.oba.addCommand({
        //     id: 'oba-CitationNotes-copy-reference-selected-doi',
        //     name: 'CitationNotes copy references of selected doi',
        //     callback: async () => {
        //         console.clear();
        //         const doi0 = this.oba.tools.getSelectedText()
        //         if (!doi0) {
        //             new Notice('Select a doi');
        //             return;
        //         }
        //         const doi = this.oba.tools.absDoi(doi0);
        //         await this.copyDoiReferences(doi);
        //     }
        // });
        
        this.oba.addCommand({
            id: 'oba-CitationNotes-copy-reference-current-note',
            name: 'CitationNotes copy references of current note',
            callback: async () => {
                console.clear();
                const biblIO = await this.getNoteBiblIO();
                const doi = biblIO?.["doi"]
                console.log("doi: ", doi)
                if (!doi) {
                    new Notice('Missing doi');
                    return;
                }
                await this.copyDoiReferences(doi);
            }
        });

        this.oba.addCommand({
            id: 'oba-CitationNotes-copy-non-local-reference-current-note',
            name: 'CitationNotes copy non-local references of current note',
            callback: async () => {
                console.clear();
                const biblIO = await this.getNoteBiblIO();
                const doi = biblIO?.["doi"]
                console.log("doi: ", doi)
                if (!doi) {
                    new Notice('Missing doi');
                    return;
                }
                await this.copyNonLocalReferences(doi);
            }
        });
        
        // this.oba.addCommand({
        //     id: "CitationNotes-copy-link-selected-reference",
        //     name: "CitationNotes copy link of selected reference",
        //     callback: async () => {
        //         console.clear();
        //         const str = this.oba.tools.getSelectedText().
        //             replace(/\D+/g, "")
        //         const refnum = parseInt(str);
        //         const note = this.oba.tools.getCurrNote()
        //         await this.copyReferenceLink(refnum,  note)
        //     }
        // });

    }

    // DOING: reimplement all this using BiblIO

    // MARK: copy
    async copyDoiReferences(doi0: string) {

        // get biblio data
        const biblIO_0 = await this.oba.crossref.getBiblIO(doi0);
        const cr_refDOIs = biblIO_0["references-DOIs"];
        if (!cr_refDOIs) { return; }

        // collect
        const refStrs: string[] = []
        let refi = 0
        for (const doi1 of cr_refDOIs) {
            const biblIO = await this.oba.biblio.consensusBiblIO(doi1)


            const citekey = biblIO["citekey"]
            // console.log("citekey: ", citekey)
            const year = biblIO?.["published-date"]?.["year"];
            // console.log("year: ", year)
            const title = biblIO?.["title"]
            // console.log("title: ", title)
            
            let str = ''
            str += `> [${refi + 1}]  `;
            if (citekey) { str += `[[@${citekey}]] `; }
            if (year) { str += `(${year}) `; }
            if (title) { str += `${title} `; }
            if (doi1) { str += `${doi1} `; }

            refi += 1;

            
            refStrs.push(str)
        } 
        const reference_section = refStrs.join('\n\n');
        await this.oba.tools.copyToClipboard(reference_section);

        new Notice(`SUCESS!!! Reference copied to clipboard.\ndoi: ${doi0}`)
    }

    async copyNonLocalReferences(doi: string) {

        // get biblio data
        const lb_biblIOs = await this.oba.localbibs.getBiblioDB();
        const cr_biblIO = await this.oba.crossref.getBiblIO(doi);
        const cr_refDOIs = cr_biblIO["references-DOIs"];
        if (!cr_refDOIs) { return; }

        // collect
        const nonLocalDOIs: string[] = []
        for (const doi1 of cr_refDOIs) {
            if (!doi1) { continue; }
            const lb_entry = await this.oba.biblio.findByDoi(doi1, lb_biblIOs)
            if (lb_entry) { continue; }
            nonLocalDOIs.push(doi1);
        }

        const reference_section = nonLocalDOIs.join('\n');
        await this.oba.tools.copyToClipboard(reference_section);

        new Notice(`SUCESS!!! DOIs copied to clipboard`)
    }

    // async copyTitle(citekey: string) {
    //     this.oba.
    // }

    // async copyReferenceLink(refnum: number, 
    //     note: TFile = this.oba.tools.getCurrNote()
    // ) {
    //     this.oba.tools.copyToClipboard("");
    //     let doi0 = await this.getBibTexDoi(note);
    //     doi0 = this.oba.tools.absDoi(doi0);
    //     console.log('doi0: ', doi0)
    //     const cr_data = await this.oba.crossref.getCrossrefData(doi0);
    //     console.log('cr_data: ', cr_data)
    //     const doi1 = this.oba.crossref.extractReferenceDoi(cr_data, refnum-1)
    //     console.log('doi1: ', doi1)
    //     if (!doi1) {
    //         new Notice("ERROR: Missing doi")
    //         return
    //     }
    //     const bibtex_data = await this.oba.localbibs.findByDoi({
    //         doi: doi1, 
    //         objList: await this.oba.localbibs.getLocalBib()
    //     });
    //     if (!bibtex_data) {
    //         new Notice(`🚨 ERROR: Missing at Local Bibtex, doi ${doi1}`)
    //         const doi2 = this.oba.tools.absDoi(doi1);
    //         const link = `\\[[${refnum}](${doi2})]]\\`
    //         this.oba.tools.copyToClipboard(link);
    //         new Notice(`Link copied in clipboard, link: ${link}`);
    //         return
    //     }

    //     console.log('bibtex_data: ', bibtex_data)
    //     const citekey1 = this.oba.localbibs.extractCiteKey(bibtex_data);
    //     console.log('citekey1: ', citekey1)
    //     const link = `\\[[[@${citekey1}|${refnum}]]\\]`
    //     console.log(link)
    //     this.oba.tools.copyToClipboard(link);
    //     new Notice(`Link copied in clipboard, link: ${link}`);
    // }

    // MARK: extract
    // TODO/TAI: do not rely on the note name
    // - Maybe add a citekey field on the yalm section of the note
    extractCiteKey(note: TFile = this.oba.tools.getCurrNote()) {
        return note?.basename?.
            replace(/\.md$/, '')?.
            replace(/^@/, '')
    }

    // MARK: get
    async getNoteBiblIO(
        note: TFile = this.oba.tools.getCurrNote()
    ) {
        const lb_biblIOs = await this.oba.localbibs.getBiblioDB();
        const citekey = this.extractCiteKey(note);
        const entry = await this.oba.biblio.findByCiteKey(citekey, lb_biblIOs);
        return entry
    }
}