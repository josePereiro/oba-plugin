import { OBA } from "src/oba-base/globals";
import { crossref, localbibs } from "./0-biblio-modules";
import { BiblIOAuthor, BiblIOData, BiblIODate, BiblIOIder } from "./biblio-data";
import { _extractFirst, _extractField, _mergeAll, tools } from "src/tools-base/0-tools-modules";
import { citnotes } from "src/citnotes-base/0-citnotes-modules";
export * from "./biblio-base"
export * from "./biblio-data"

/*
    Integrated tools to work with bibliography data
    // TODO/TAI create local/online search interface
*/

export function onload() {
    // modules onload
    crossref.onload()
    localbibs.onload()

    // MARK: commands
    OBA.addCommand({
        id: 'oba-biblio-get-consensus-biblio',
        name: 'BiblIO get consensus biblIO',
        callback: async () => {
            console.clear();
            const sel = tools.getSelectedText();
            console.log("sel: ", sel);
            const data = await consensusBiblIO({"query": sel});
            console.log("data: ", data);
        }
    });

    OBA.addCommand({
        id: 'oba-biblio-dev',
        name: 'BiblIO dev',
        callback: async () => {
            console.clear();
        }
    });
}

