import { OBA } from "src/oba-base/globals";
import { crossref, localbibs } from "./0-biblio-modules";
import { checkEnable, tools } from "src/tools-base/0-tools-modules";
import { consensusBiblIO } from "./biblio-base";
import { getSelectedText } from "src/tools-base/obsidian-tools";
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
        id: 'oba-biblio-get-selection-consensus-biblio',
        name: 'BiblIO get selection consensus biblIO',
        callback: async () => {
            checkEnable("biblio", { notice: true, err: true })
            console.clear();
            const sel = getSelectedText();
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

