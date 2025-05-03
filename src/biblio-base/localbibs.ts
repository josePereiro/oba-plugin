import { obaconfig } from 'src/oba-base/0-oba-modules';
import { addObaCommand } from 'src/oba-base/commands';
import { vscodeGotoFile } from 'src/services-base/vscode';
import * as localbibsbase from './localbibs-base';
import { clearJSONCache, clearRAMCache, getMergedBiblIO } from './localbibs-base';
export * from "./localbibs-base";


/*
    Allow using local .bib files as sources of bibliography data. 
*/ 
export function onload() {
        
    // base 
    localbibsbase.onload();

    console.log("LocalBibs:onload");

    addObaCommand({
        commandName: "Clear JSON caches",
        serviceName: "LocalBIBs",
        async commandCallback({ commandID, commandFullName }) {
            console.clear();
            await clearJSONCache()
        },
    })

    addObaCommand({
        commandName: "Clear RAM caches",
        serviceName: "LocalBIBs",
        async commandCallback({ commandID, commandFullName }) {
            console.clear();
            clearRAMCache()
        },
    })

    addObaCommand({
        commandName: "Clear ALL caches",
        serviceName: "LocalBIBs",
        async commandCallback({ commandID, commandFullName }) {
            console.clear();
            clearRAMCache()
            await clearJSONCache()
        },
    })

    addObaCommand({
        commandName: "Load merged biblIO",
        serviceName: "LocalBIBs",
        async commandCallback({ commandID, commandFullName }) {
            console.clear();
            const biblIO = await getMergedBiblIO()
            console.log("biblIO")
            console.log(biblIO)
        },
    })

    addObaCommand({
        commandName: "Dev: open localbibs in vscode",
        serviceName: "LocalBIBs",
        async commandCallback({ commandID, commandFullName }) {
            console.clear();
            const sourceFiles: string[] = 
                obaconfig.getObaConfig("local.bib.files")
            for (const file of sourceFiles) {
                console.log("file: ", file)
                vscodeGotoFile(file)
            }
        },
    })

    addObaCommand({
        commandName: "dev",
        serviceName: "LocalBIBs",
        async commandCallback({ commandID, commandFullName }) {
            console.clear();
            const sourceFiles: string[] = 
                obaconfig.getObaConfig("local.bib.files")
            console.log("sourceFiles: ", sourceFiles)
            const lb_data0 = await localbibsbase.parseBibFileFullFile(sourceFiles[0])
            console.log("lb_data0: ", lb_data0)
            const lb_data1 = await localbibsbase.parseBibFileStream(sourceFiles[0])
            console.log("lb_data1: ", lb_data1)
        },
    })
}

