import { OBA } from "src/oba-base/globals";
import { checkEnable, spawnCommand, tools, TriggerManager } from "./0-tools-modules";
import { obanotes } from "src/services-base/0-servises-modules";
import { getCurrNote, getNoteYamlHeader, getSelectedText, getVaultDir, modifyNoteYamlHeader } from "./obsidian-tools";
import { Notice } from "obsidian";

const TestTriggerManager = new TriggerManager(5000, 500, 5000)

export function onload() {
        
    console.log("Tools:onload");

    OBA.addCommand({
        id: "tools-spawn-bash-command",
        name: "Tools spawn bash command",
        callback: async () => {
            console.clear()
            const sel = getSelectedText();
            if (!sel) { return }
            const dig = sel.split("|")
            const cmdstr = dig[0].trim()
            console.log("cmdstr: ", cmdstr)
            const args = dig.slice(1).map((arg) => {
                return arg.trim()
            })
            console.log("args: ", args)
            const res = await spawnCommand({
                cmdstr,
                args,
                options: {
                    cwd: getVaultDir()
                },
                rollTimeOut: true,
                timeoutMs: 10 * 1000,
                onAnyData({ chunck } : {chunck: string}) {
                    console.log(chunck)
                },
            })
            console.log("res: ", res)
        },
    });

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