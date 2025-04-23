import { OBA } from "src/oba-base/globals";
import { checkEnable, tools, TriggerManager } from "./0-tools-modules";
import { obanotes } from "src/services-base/0-servises-modules";
import { getCurrNote, getNoteYamlHeader, modifyNoteYamlHeader } from "./obsidian-tools";

const TestTriggerManager = new TriggerManager(5000, 500, 5000)

export function onload() {
        
    console.log("Tools:onload");

    // OBA.addCommand({
    //     id: "tools-dev",
    //     name: "Tools dev",
    //     callback: async () => {
    //         console.clear();
    //         const sel = getSelectedText();
    //         console.log("sel: ", sel);
    //         const h = tools.hash64(sel);
    //         console.log("hash64: ", h);
    //     },
    // });

    OBA.addCommand({
        id: "tools-dev",
        name: "Tools dev",
        callback: async () => {
            checkEnable("tools", {err: true, notice: true})
            console.clear();
            const note = getCurrNote({strict: true});
            let yaml = getNoteYamlHeader(note);
            console.log("yaml: ", yaml);
            yaml = await modifyNoteYamlHeader(note, (yaml) => {
                yaml["oba.test"] = tools.randstring()
            })
            console.log("yaml: ", yaml);
            const uuid = await obanotes.ensureObaNoteID(note)
            console.log("uuid: ", uuid);
        },
    });

    OBA.addCommand({
        id: "tools-test-TriggerManager",
        name: "Tools test TriggerManager",
        callback: async () => {
            checkEnable("tools", {err: true, notice: true})
            TestTriggerManager.manage({
                ongo() {
                    console.log("ongo")
                    console.log("callCount: ", TestTriggerManager.callCount)
                    console.log("elapsed: ", TestTriggerManager.elapsed)
                },
                onnotyet() {
                    console.log("onnotyet")
                    console.log("callCount: ", TestTriggerManager.callCount)
                    console.log("elapsed: ", TestTriggerManager.elapsed)
                },
                onwait() {
                    console.log("onwait")
                    console.log("callCount: ", TestTriggerManager.callCount)
                    console.log("elapsed: ", TestTriggerManager.elapsed)
                },
                prewait() {
                    console.clear();
                    console.log("prewait")
                    console.log("callCount: ", TestTriggerManager.callCount)
                    console.log("elapsed: ", TestTriggerManager.elapsed)
                },
            })
        },
    });

}