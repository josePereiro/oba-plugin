import { addObaCommand } from "src/oba-base/commands";
import { crossref, localbibs } from "./0-biblio-modules";
import { getSelectedText } from "src/tools-base/obsidian-tools";
import { consensusBiblIO } from "./biblio-base";
export * from "./biblio-base";
export * from "./biblio-data";

/*
    Integrated tools to work with bibliography data
    - A main feature is just a search bib -> create citation tool
*/

export function onload() {
    // modules onload
    crossref.onload()
    localbibs.onload()

    // MARK: commands
    addObaCommand({
        commandName: "log selection's consensus biblIO",
        serviceName: ["BiblIO", "Dev"],
        async commandCallback({ commandID, commandFullName }) {
            console.clear();
            const sel = getSelectedText();
            console.log("sel: ", sel);
            const data = await consensusBiblIO({"query": sel});
            console.log("data: ", data);
        },
    })
}

