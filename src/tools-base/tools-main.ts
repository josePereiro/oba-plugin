import { OBA } from "src/oba-base/globals";
import { getSelectedText } from "./obsidian-tools";
import { hash64 } from "./utils-tools";

export function onload() {
        
    console.log("Tools:onload");

    OBA.addCommand({
        id: "tools-dev",
        name: "Tools dev",
        callback: async () => {
            console.clear();
            const sel = getSelectedText();
            console.log("sel: ", sel);
            const h = hash64(sel);
            console.log("hash64: ", h);
        },
    });

}