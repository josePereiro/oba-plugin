import { OBA } from 'src/oba-base/globals';
import * as tools from '../tools-base/0-tools-modules';
import { getBiblIO } from './crossref-base';
import * as crossrefbase from './crossref-base'
import { biblio } from './0-biblio-modules';
import { getSelectedText } from 'src/tools-base/obsidian-tools';
export * from './crossref-base';

/*
    This is the CrossRef Service
    - Add some high level utils and/or commands
*/

// // MARK: onload
export function onload() {
    
    // base
    crossrefbase.onload()
    
    console.log("CrossRef:onload");

    // OBA.addCommand({
    //     id: "CrossRef-dev",
    //     name: "CrossRef dev",
    //     callback: async () => {
    //         tools.checkEnable("crossref", { notice: true, err: true })
    //         console.clear();
    //         const sel = getSelectedText();
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
            tools.checkEnable("crossref", { notice: true, err: true })
            console.clear();
            const sel = getSelectedText();
            console.log("sel: ", sel);
            const ider = await biblio.resolveBiblIOIder({query: sel});
            console.log("ider: ", ider);
            const biblIO = await getBiblIO(ider);
            console.log("biblIO: ", biblIO);
        }
    });

    OBA.addCommand({
        id: 'oba-crossref-dev',
        name: 'Crossref dev',
        callback: async () => {
            tools.checkEnable("crossref", { notice: true, err: true })
            console.clear();
            const sel = getSelectedText();
            console.log("sel: ", sel);
            const ider = await biblio.resolveBiblIOIder({query: sel});
            console.log("ider: ", ider);
            const biblIO = await getBiblIO(ider);
            console.log("biblIO: ", biblIO);
        }
    });
}