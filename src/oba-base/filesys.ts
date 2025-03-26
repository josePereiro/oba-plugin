import { existsSync, mkdirSync } from "fs";
import { join } from "path";
import { getVaultDir } from "src/tools-base/obsidian-tools";


export function getSubDir(root: string, ...names: string[]): string {
    const _dir = join(root, ...names);
    if (!existsSync(_dir)) {
        mkdirSync(_dir, { recursive: true });
    }
    return _dir;
}

/*
    #TODO/ Need sync with backend interface
*/ 
export function getObaDir(...names: string[]): string {
    return getSubDir(getVaultDir(), ".Oba", ...names);
}
