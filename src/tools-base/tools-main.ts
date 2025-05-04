import { addObaCommand } from "src/oba-base/commands";
import { obanotes } from "src/services-base/0-servises-modules";
import { spawnCommand, tools, TriggerManager } from "./0-tools-modules";
import { getCurrNote, getNoteYamlHeader, getSelectedText, getVaultDir, modifyNoteYamlHeader } from "./obsidian-tools";

const TestTriggerManager = new TriggerManager(5000, 500, 5000)

export function onload() {
        
    console.log("Tools:onload");

    addObaCommand({
        commandName: "spawn bash command",
        serviceName: ["Tools", "Dev"],
        async commandCallback({ commandID, commandFullName }) {
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
    })

    addObaCommand({
        commandName: "test",
        serviceName: ["Tools", "Dev"],
        async commandCallback({ commandID, commandFullName }) {
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
    })

    addObaCommand({
        commandName: "test TriggerManager",
        serviceName: ["Tools", "Dev"],
        async commandCallback({ commandID, commandFullName }) {
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
    })

}