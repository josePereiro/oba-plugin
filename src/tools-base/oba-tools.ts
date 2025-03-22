import { join } from "path"
import { getVaultDir } from "./obsidian-tools"
import { OBA } from "src/0-base/globals"

export function getObaPluginDir(): string {
    const vaultDir = getVaultDir()
    const path = join(
        vaultDir, OBA.app.vault.configDir, 
        'plugins', "oba-plugin"
    )
    return path
}