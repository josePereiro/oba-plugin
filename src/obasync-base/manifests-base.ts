import path from "path";
import { getObsSyncDir, utcTimeTag } from "./utils-base";
import { JsonIO } from "src/tools-base/jsonio-base";
import { ObaSyncIssuedSignal, ObaSyncProcessedSignal } from "./signals-base";
import { existsSync } from "fs";

/*
    Each channel will have a manifest with signals and report of actions. 
*/ 

export interface ObaSyncManifestIder {
    channelName: string
    manType: string
}

export interface ObaSyncManifest {
    "type"?: string,
    "meta"?: {
        "userName"?: string,
        [keys: string]: any
    },
    "issued.signals"?: {[keys: string]: ObaSyncIssuedSignal},
    "processed.signals"?: {[keys: string]: ObaSyncProcessedSignal},
}

export function manifestFilePath(
    depotDir: string, 
    manIder: ObaSyncManifestIder
) {
    const {channelName, manType} = manIder
    const obasyncDir = getObsSyncDir(depotDir);
    return path.join(obasyncDir, `${channelName}-${manType}-man.json`)
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

export function modifyObaSyncManifest(
    depotDir: string, 
    userName: string,
    manIder: ObaSyncManifestIder,
    onmod: (manContent: ObaSyncManifest) => any
) {
    const manIO = manifestJsonIO(depotDir, manIder)
    manIO.depot({})
    let obortFlag = null
    manIO.withDepot((manContent: ObaSyncManifest) => {
        // defaults
        manContent["type"] = manIder['manType']
        manContent["meta"] = manContent?.["meta"] || {}
        manContent["meta"]["userName"] = userName
        manContent["meta"]["channelName"] = manIder['channelName']
        manContent["meta"]["modified.timestamp"] = utcTimeTag()
        // modify callback
        obortFlag = onmod(manContent)
    })
    if (obortFlag == 'abort') { return null; }
    manIO.write()
    return manIO
}

// export function getCallbackContext(): ObaSyncCallbackContext {
//     return getCallbackArgs()?.[0]
// }
    