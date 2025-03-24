import { OBA } from 'src/oba-base/globals';
import * as tools from '../tools-base/0-tools-modules';
import { getBiblIO, getCrossrefData } from './crossref-base';
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

    OBA.addCommand({
        id: 'oba-crossref-selected-doi',
        name: 'Crossref fetch selected doi',
        callback: async () => {
            console.clear();
            const sel = tools.getSelectedText();
            console.log("sel: ", sel);
            const biblIO = await getBiblIO(sel);
            console.log("biblIO: ", biblIO);
        }
    });

    OBA.addCommand({
        id: 'oba-crossref-dev',
        name: 'Crossref dev',
        callback: async () => {
            console.clear();
            const sel = tools.getSelectedText();
            console.log("sel: ", sel);
            const biblIO = await getBiblIO(sel);
            console.log("biblIO: ", biblIO);
        }
    });
}