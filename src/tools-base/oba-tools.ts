import { join } from "path"
import { getVaultDir } from "./obsidian-tools"
import { OBA } from "src/oba-base/globals"
import { getObaConfig } from "src/oba-base/obaconfig"
import { Notice } from "obsidian"

export function getObaPluginDir(): string {
    const vaultDir = getVaultDir()
    const path = join(
        vaultDir, OBA.app.vault.configDir, 
        'plugins', "oba-plugin"
    )
    return path
}

export function checkEnable(
    syskey: string, {
        notice = false,
        err = false,
    } = {}
) { 
    const key = `${syskey}.enable`;
    const sysflag = getObaConfig(key, false)
    const allflag = getObaConfig(`all.enable`, false)
    const enflag = allflag || sysflag
    if (!enflag) {
        const msg = `system ${syskey} disable! Set '${key}'`
        if (notice) { new Notice(msg) }
        if (err) { throw {msg} }
    }
    return enflag
}