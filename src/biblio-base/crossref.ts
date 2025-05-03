import { addObaCommand } from 'src/oba-base/commands';
import { OBA } from 'src/oba-base/globals';
import { getSelectedText } from 'src/tools-base/obsidian-tools';
import * as tools from '../tools-base/0-tools-modules';
import { biblio } from './0-biblio-modules';
import * as crossrefbase from './crossref-base';
import { getBiblIO } from './crossref-base';
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

    // MARK: commands
    addObaCommand({
        commandName: "fetch selected doi",
        serviceName: "Crossref",
        async commandCallback({ commandID, commandFullName }) {
            console.clear();
            const sel = getSelectedText();
            console.log("sel: ", sel);
            const ider = await biblio.resolveBiblIOIder({query: sel});
            console.log("ider: ", ider);
            const biblIO = await getBiblIO(ider);
            console.log("biblIO: ", biblIO);
        },
    })
}