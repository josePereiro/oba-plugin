import { isEqual } from "lodash";
import { Notice } from "obsidian";
import path from "path";
import { JsonIO } from "src/tools-base/jsonio-base";
import { ObaSyncSignal } from "./signals-base";
import { getObsSyncDir, utcTimeTag } from "./utils-base";
import { _showErrorReport } from "src/gittools-base/gittools-base";

/*
    Each channel will have a manifest with signals and report of actions. 
*/ 

// Manifests from other versions will be ignored!
export const MAN_VERSION = "v1"

export interface ObaSyncManifestIder {
    channelName: string
    manType: string
}

/*
    //TODO/ Add pusher check
    - on each push, the manifest is checked
        - check ${channelName}-${userName} between local oba and repo manifest
*/ 
export interface ObaSyncManifest {
    "type"?: string,
    "meta"?: {
        "userName"?: string,
        "pusher"?: ObaSyncManifestIder, // TODO/ add a check
        [keys: string]: any
    },
    "signals"?: {[keys: string]: ObaSyncSignal},
}

export function manifestFilePath(
    depotDir: string, 
    manIder: ObaSyncManifestIder
) {
    const {channelName, manType} = manIder
    const obasyncDir = getObsSyncDir(depotDir);
    return path.join(obasyncDir, `${channelName}-${manType}-${MAN_VERSION}-man.json`)
}

export function manifestJsonIO(
    depotDir: string, 
    manIder: ObaSyncManifestIder
) {
    const manFile = manifestFilePath(depotDir, manIder);
    const manIO = new JsonIO()
    manIO.file(manFile)
    return manIO
}

export function modifyObaSyncManifest({
    manJIO, 
    userName, 
    manIder,
    onmod = () => null
} : {
    manJIO: JsonIO, 
    userName: string,
    manIder: ObaSyncManifestIder,
    onmod?: (manContent: ObaSyncManifest) => any
}) {
    manJIO.loaddOnDemand({})
    let obortFlag = null
    manJIO.withDepot((manContent: ObaSyncManifest) => {
        // defaults
        manContent["type"] = manIder['manType']
        manContent["meta"] = manContent?.["meta"] || {}
        manContent["meta"]["userName"] = userName
        manContent["meta"]["channelName"] = manIder['channelName']
        manContent["meta"]["pusher"] = manIder
        manContent["meta"]["modified.timestamp"] = utcTimeTag()
        // modify callback
        obortFlag = onmod(manContent)
    })
    if (obortFlag == 'abort') { return null; }
    manJIO.write()
    return manJIO
}

export function checkPusher(
    pusher0: ObaSyncManifestIder,
    manIO1: JsonIO
) {
    const man1: ObaSyncManifest = manIO1.loaddOnDemand({}).retDepot()
    const pusher1: ObaSyncManifestIder | null = man1?.["meta"]?.["pusher"] || null
    if (!pusher1) { return true; }
    if (pusher1 && !isEqual(pusher0, pusher1)) {
        _showErrorReport('Invalid pusher!', {pusher0, pusher1})
        return false
    }
    return true
}
