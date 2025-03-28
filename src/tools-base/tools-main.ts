import { OBA } from "src/oba-base/globals";
import { tools } from "./0-tools-modules";
import { obanotes } from "src/services-base/0-servises-modules";

export function onload() {
        
    console.log("Tools:onload");

    // OBA.addCommand({
    //     id: "tools-dev",
    //     name: "Tools dev",
    //     callback: async () => {
    //         console.clear();
    //         const sel = tools.getSelectedText();
    //         console.log("sel: ", sel);
    //         const h = tools.hash64(sel);
    //         console.log("hash64: ", h);
    //     },
    // });

    OBA.addCommand({
        id: "tools-dev",
        name: "Tools dev",
        callback: async () => {
            console.clear();
            const note = tools.getCurrNote({strict: true});
            let yaml = tools.getNoteYamlHeader(note);
            console.log("yaml: ", yaml);
            yaml = await tools.modifyNoteYamlHeader(note, (yaml) => {
                yaml["oba.test"] = tools.randstring()
            })
            console.log("yaml: ", yaml);
            const uuid = await obanotes.ensureObaNoteID(note)
            console.log("uuid: ", uuid);
        },
    });

}