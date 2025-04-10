import { tools } from "src/tools-base/0-tools-modules";
import { getVaultDir } from "src/tools-base/obsidian-tools";


export function buildObaDirPath(vault: string) {
    return tools.getSubDir(vault, ".Oba")
}

/*
    #NOTE/ Need sync with backend interface
*/ 
export function getObaDir(...names: string[]): string {
    const obaDir = buildObaDirPath(getVaultDir())
    return tools.getSubDir(obaDir, ...names);
}
