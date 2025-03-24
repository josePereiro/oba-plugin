import { clearJSONCache, clearRAMCache, getBiblIO, getMergedBiblIO} from './localbibs-base';
import { OBA } from 'src/oba-base/globals';
import { tools } from 'src/tools-base/0-tools-modules';
export * from "./localbibs-base"


/*
    Allow using local .bib files as sources of bibliography data. 
*/ 
export function onload() {
        
    console.log("LocalBibs:onload");

    OBA.addCommand({
        id: "localbibs-clear-json-cache",
        name: "LocalBIBs Clear JSON caches",
        callback: async () => {
            console.clear();
            await clearJSONCache()
        },
    });

    OBA.addCommand({
        id: "localbibs-clear-ram-cache",
        name: "LocalBIBs Clear RAM caches",
        callback: () => {
            console.clear();
            clearRAMCache()
        },
    });

    OBA.addCommand({
        id: "localbibs-clear-all-cache",
        name: "LocalBIBs Clear ALL caches",
        callback: async () => {
            console.clear();
            clearRAMCache()
            await clearJSONCache()
        },
    });

    OBA.addCommand({
        id: "LocalBibs-load-merged-biblIO",
        name: "LocalBibs load merged biblIO",
        callback: async () => {
            console.clear();
            const biblIO = await getMergedBiblIO()
            console.log("biblIO")
            console.log(biblIO)
        },
    });

    OBA.addCommand({
        id: "LocalBibs-dev",
        name: "LocalBibs dev",
        callback: async () => {
            console.clear();
            const sel = tools.getSelectedText();
            console.log("sel: ", sel);
            const biblIO = await getBiblIO(sel);
            console.log("biblIO")
            console.log(biblIO)
        }
    });
}

