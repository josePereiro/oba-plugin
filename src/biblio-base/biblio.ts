import { localbibs } from "./0-biblio-modules";
export * from "./biblio-base";
export * from "./biblio-data";

/*
    Integrated tools to work with bibliography data
    - A main feature is just a search bib -> create citation tool
*/

export function onload() {
    // modules onload
    // crossref.onload()
    localbibs.onload()

    // // MARK: commands
    // addObaCommand({
    //     commandName: "Dev: log selection's consensus biblIO",
    //     serviceName: ["BiblIO"],
    //     async commandCallback({ commandID, commandFullName }) {
    //         console.clear();
    //         const sel = getSelectedText();
    //         console.log("sel: ", sel);
    //         const data = await consensusBiblIO({"query": sel});
    //         console.log("data: ", data);
    //     },
    // })
}

