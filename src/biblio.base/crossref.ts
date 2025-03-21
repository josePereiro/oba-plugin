import ObA from '../main';
import { SimilarityModal } from '../modals';
import { CrossRefBase } from './crossref.base';

/*
    This is the CrossRef Service
     -Add some high level utils and/or commands
*/
export class CrossRef extends CrossRefBase {

    constructor(oba: ObA) {
        super(oba);
        
        console.log("CrossRef:constructor");

        this.oba.addCommand({
            id: 'oba-crossref-dev',
            name: 'Crossref dev',
            callback: async () => {
                console.clear();
                const sel = this.oba.tools.getSelectedText();
                console.log("sel: ", sel);
                const data = await this.getCrossrefData(sel);
                console.log("data: ", data);
                const biblio = await this.getBiblio(sel);
                console.log("biblio: ", biblio);
            }
        });

        // // MARK: Commands
        // this.oba.addCommand({
        //     id: "CrossRef-dev",
        //     name: "CrossRef dev",
        //     callback: async () => {
        //         console.clear();
        //         const sel = this.oba.tools.getSelectedText();
        //         console.log("sel: ", sel);
        //         const doi = this.oba.tools.absDoi(sel);

        //         const options = await this.getReferencesCitationV1(doi);
        //         // console.log("options")
        //         // console.log(options)
        //         const modal = new SimilarityModal(this.oba, options,
        //             (selectedOption) => {
        //             console.log("Selected Option:", selectedOption);
        //             // Do something with the selected option
        //         });
        //         modal.open();
        //     },
        // });

        // this.oba.addCommand({
        //     id: 'oba-crossref-selected-doi',
        //     name: 'Crossref fetch selected doi',
        //     callback: async () => {
        //         console.clear();
        //         const sel = this.oba.tools.getSelectedText();
        //         console.log("sel: ", sel);
        //         const doi = this.oba.tools.absDoi(sel);
        //         const data = await this.getCrossrefData(doi);
        //         console.log("data: ", data);
        //     }
        // });
    }

    // async forEachReferenceData(
    //     doi0: string, 
    //     dofun: (cr_data: any, refi: number) => any
    // ) {
    //     const doi = this.oba.tools.absDoi(doi0);
    //     const cr_data = await this.oba.crossref.getCrossrefData(doi);
    //     console.log('cr_data: ', cr_data)
    //     const refcount = this.extractReferencesCount(cr_data)
    //     for (let refi = 0; refi < refcount; refi++) {
    //         const ret = await dofun(cr_data, refi);
    //         if (ret == "break") { break; }
    //     }
    // }

    // async downloadAllReferences(doi0: string) {
    //     this.forEachReferenceData(doi0, 
    //         async (cr_data, refi) => {
    //             const doi1 = this.extractReferenceDoi(cr_data, refi)
    //             await this.fetchOnDemandCrossrefData(doi1)
    //         }
    //     )
    // }

    // // Move out
    // _createCitationV1(cr_data: any) {
    //     let digest = ''

    //     // authors
    //     const authors = cr_data?.['message']?.['author'] ?? []
    //     let count = 0
    //     for (const author of authors) {
    //         digest += author?.['family'] ?? ''
    //         digest += ' '
    //         digest += author?.['given'] ?? ''
    //         digest += ' '
    //         count += 1;
    //         if (count >= 2) { break; }
    //     }

    //     // year
    //     digest += cr_data?.['message']?.['created']?.['date-parts']?.[0]?.[0] ?? ''
    //     return digest
    // }
}

