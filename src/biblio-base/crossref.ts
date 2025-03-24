import { OBA } from 'src/oba-base/globals';
import * as tools from '../tools-base/0-tools-base';
import * as crossrefbase from './crossref-base';
export * from './crossref-base';

/*
    This is the CrossRef Service
    - Add some high level utils and/or commands
*/

// // MARK: onload
export function onload() {
    
    console.log("CrossRef:onload");

    // OBA.addCommand({
    //     id: "CrossRef-dev",
    //     name: "CrossRef dev",
    //     callback: async () => {
    //         console.clear();
    //         const sel = tools.getSelectedText();
    //         console.log("sel: ", sel);
    //         const doi = tools.absDoi(sel);

    //         const options = await getReferencesCitationV1(doi);
    //         // console.log("options")
    //         // console.log(options)
    //         const modal = new SimilarityModal(OBA, options,
    //             (selectedOption) => {
    //             console.log("Selected Option:", selectedOption);
    //             // Do something with the selected option
    //         });
    //         modal.open();
    //     },
    // });

    // TODO/DOING
    OBA.addCommand({
        id: 'oba-crossref-selected-doi',
        name: 'Crossref fetch selected doi',
        callback: async () => {
            console.clear();
            const sel = tools.getSelectedText();
            console.log("sel: ", sel);
            const doi = tools.absDoi(sel);
            const data = await crossrefbase.getCrossrefData(doi);
            console.log("data: ", data);
        }
    });
}

// async forEachReferenceData(
//     doi0: string, 
//     dofun: (cr_data: any, refi: number) => any
// ) {
//     const doi = oba.tools.absDoi(doi0);
//     const cr_data = await oba.crossref.getCrossrefData(doi);
//     console.log('cr_data: ', cr_data)
//     const refcount = extractReferencesCount(cr_data)
//     for (let refi = 0; refi < refcount; refi++) {
//         const ret = await dofun(cr_data, refi);
//         if (ret == "break") { break; }
//     }
// }

// async downloadAllReferences(doi0: string) {
//     forEachReferenceData(doi0, 
//         async (cr_data, refi) => {
//             const doi1 = extractReferenceDoi(cr_data, refi)
//             await fetchOnDemandCrossrefData(doi1)
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

