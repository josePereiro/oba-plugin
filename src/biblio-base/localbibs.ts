import { clearJSONCache, clearRAMCache, getMergedBiblIO} from './localbibs-base';
import { OBA } from 'src/oba-base/globals';
import * as localbibsbase from './localbibs-base';
import { obaconfig } from 'src/oba-base/0-oba-modules';
import { vscode } from 'src/services-base/0-servises-modules';
import { checkEnable } from 'src/tools-base/oba-tools';
export * from "./localbibs-base"


/*
    Allow using local .bib files as sources of bibliography data. 
*/ 
export function onload() {
        
    // base 
    localbibsbase.onload();

    console.log("LocalBibs:onload");

    OBA.addCommand({
        id: "localbibs-clear-json-cache",
        name: "LocalBIBs Clear JSON caches",
        callback: async () => {
            checkEnable("localbibs", true)
            console.clear();
            await clearJSONCache()
        },
    });

    OBA.addCommand({
        id: "localbibs-clear-ram-cache",
        name: "LocalBIBs Clear RAM caches",
        callback: () => {
            checkEnable("localbibs", true)
            console.clear();
            clearRAMCache()
        },
    });

    OBA.addCommand({
        id: "localbibs-clear-all-cache",
        name: "LocalBIBs Clear ALL caches",
        callback: async () => {
            checkEnable("localbibs", true)
            console.clear();
            clearRAMCache()
            await clearJSONCache()
        },
    });

    OBA.addCommand({
        id: "LocalBibs-load-merged-biblIO",
        name: "LocalBibs load merged biblIO",
        callback: async () => {
            checkEnable("localbibs", true)
            console.clear();
            const biblIO = await getMergedBiblIO()
            console.log("biblIO")
            console.log(biblIO)
        },
    });

    OBA.addCommand({
        id: "LocalBibs-vscode-open-localbibs",
        name: "LocalBibs vscode open localbibs",
        callback: async () => {
            checkEnable("localbibs", true)
            console.clear();
            const sourceFiles: string[] = 
                obaconfig.getObaConfig("local.bib.files")
            for (const file of sourceFiles) {
                console.log("file: ", file)
                vscode.goto(file)
            }
        },
    });

    OBA.addCommand({
        id: "LocalBibs-dev",
        name: "LocalBibs dev",
        callback: async () => {
            checkEnable("localbibs", true)
            console.clear()
            const sourceFiles: string[] = 
                obaconfig.getObaConfig("local.bib.files")
            console.log("sourceFiles: ", sourceFiles)
            const lb_data0 = await localbibsbase.parseBibFileFullFile(sourceFiles[0])
            console.log("lb_data0: ", lb_data0)
            const lb_data1 = await localbibsbase.parseBibFileStream(sourceFiles[0])
            console.log("lb_data1: ", lb_data1)
        }
    });

    // OBA.addCommand({
    //     id: "LocalBibs-dev",
    //     name: "LocalBibs dev",
    //     callback: async () => {
    //         checkEnable("localbibs", true)
    //         console.clear();
    //         const sel = getSelectedText();
    //         console.log("sel: ", sel);
    //         const ider = await biblio.resolveBiblIOIder({query: sel});
    //         console.log("ider: ", ider);
    //         const biblIO = await getBiblIO(ider);
    //         console.log("biblIO")
    //         console.log(biblIO)
    //     }
    // });
}

