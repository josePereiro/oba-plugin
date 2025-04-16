import path from "path";
import { getObsSyncDir, utcTimeTag } from "./utils-base";
import { JsonIO } from "src/tools-base/jsonio-base";
import { readDir } from "src/tools-base/files-tools";
import { ObaSyncCallbackContext } from "./signals-base";
import { getCallbackArgs } from "src/services-base/callbacks";

/*
    Each channel will have a manifest with signals and report of actions. 
*/ 

export function depotManifestFile(
    depotDir: string, 
    userName: string, 
    manKey: string
) {
    const obasyncDir = getObsSyncDir(depotDir);
    return path.join(obasyncDir, `${userName}-${manKey}-man.json`)
}

export function remoteManifestIO(
    depotDir: string, 
    userName: string, 
    manKey: string
) {
    const man = depotManifestFile(depotDir, userName, manKey);
    const io = new JsonIO()
    io.file(man)
    return io
}

export async function loadAllManifestIOs(
    depotDir: string,
    manKey: string
) {
    const mans: {[keys: string]: JsonIO} = {} 
    const suffix = `-${manKey}-man.json`
    await readDir(
        depotDir, 
        {
            walkdown: false,
            onfile: (_path: string) => {
                if (!_path.endsWith(suffix)) { return; }
                const io = new JsonIO()
                io.file(_path)
                const user = io.loadd({}).getd("user", null).retVal()
                if (!user) { return; } 
                mans[user] = io
            },
        } 
    ) 
    return mans
}

export function modifyObaSyncManifest(
    depotDir: string,
    userName: string, 
    manKey: string,
    onmod: (manContent: any) => any
) {
    const manIO = remoteManifestIO(depotDir, userName, manKey)
    manIO.loadd({})
    manIO.withDepot((manContent: any) => {
        // defaults
        manContent["user"] = userName
        manContent["modified.timestamp"] = utcTimeTag()
        onmod(manContent)
    })
    manIO.write()
    return manIO.retDepot()
}


export function getCallbackContext(): ObaSyncCallbackContext {
    return getCallbackArgs()?.[0]
}
    