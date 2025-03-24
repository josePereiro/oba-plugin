import { existsSync, mkdirSync } from "fs";
import { join } from "path";
import { getVaultDir } from "src/tools-base/obsidian-tools";

/*
    #TODO/ Need sync with backend interface
*/ 
export function getObaDir(): string {
    const vault = getVaultDir();
    const obaDir = join(vault, ".Oba");
    if (!existsSync(obaDir)) {
        mkdirSync(obaDir, { recursive: true });
    }
    return obaDir;
}

