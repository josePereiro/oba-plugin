import path from "path";
import { obaconfig } from "src/oba-base/0-oba-modules";
import { tools } from "src/tools-base/0-tools-modules";

export function getObsSyncDir(
    depot: string
) {
    return tools.mkSubDir(depot, ".obasync")
}

// get universal time
export function utcTimeTag() {
    return new Date().toISOString();
}

export function getSyncChannelsConfig(
    channelName: string,
    key: string,
    dflt: any = null
) {
    const subVaultsConfig = obaconfig.getObaConfig("obasync.channels", {})
    const subVaultConf = subVaultsConfig?.[channelName] ?? {}
    return subVaultConf?.[key] ?? dflt
}

export function getRemotePullDir(
    channelName: string,
    dflt: any = null
) {
    return getSyncChannelsConfig(channelName, "pull.dest.folder.relpath", dflt)
}

export function getRemotePath(
    localPath: string, 
    remoteDir: string
) {
    path.join(remoteDir, path.basename(localPath))
}
