import { copyFileSync } from "fs"
import { Notice } from "obsidian"
import { gitSyncUp, gitSyncUpCallbackReturn } from "src/gittools-base/gitSyncUp"
import { getObaConfig } from "src/oba-base/obaconfig"
import { UnionParam, addDefaults } from "src/tools-base/utils-tools"
import { ObaSyncManifestIder, manifestJsonIO, modifyObaSyncManifest, ObaSyncManifest, checkPusher } from "./manifests-base"
import { getObaSyncAllChannelsConfig, ObaSyncOneChannelConfig } from "./obasync-base"
import { _signalHashKey, ObaSyncSignal } from "./signals-base"
import { utcTimeTag } from "./utils-base"


/*
    \TAI Rename using the Shuttle word?
    - GitShuttle
*/


/*
    \TAI DESIGN
    - Maybe I need to make a class which whole all configurations and actions.
    - For instance:
    const syncHanlder = new SyncHandler()
        .pushRepo({...})
        .vault({...})
        .callback(()=>{...})
        .schedule({...})
        .syncControl({
            cloneEnable = false,
            mkRepoDirEnable = true,
            rmRepoEnable = false,
        })
        .syncUp()
*/ 

// MARK: publishSignal
export async function publishSignal(
    publishSignalArgs
: {
    vaultDepot: string,
    committerName: string,
    manIder: ObaSyncManifestIder,
    signalTemplate: ObaSyncSignal,
    hashDig?: string[],
    notifyEnable?: boolean
    callback?: (() => any)

    gitSyncUpArgs: UnionParam<typeof gitSyncUp>,
}) {   

    // publishSignalArgs only
    addDefaults(publishSignalArgs, {
        hashDig: [],
        notifyEnable: true
    })

    // gitSyncUpArgs only
    const { gitSyncUpArgs } = publishSignalArgs
    addDefaults(gitSyncUpArgs, {
        cloneEnable: false,
        mkRepoDirEnable: true,
        rmRepoEnable: false,
        addEnable: true,
        commitEnable: true,
        commitMsg: `publishSignal - ${utcTimeTag()}`,
        pushEnable: false,
        touchEnable: false,
        cloneForce: false,
        dummyText: 'Hello Oba',
        timeoutMs: 20 * 1000,
        rollTimeOut: true,
    })
    const pushRepoOps = gitSyncUpArgs["repoOps"]

    let signal: ObaSyncSignal | null = null;
    gitSyncUp({
        ...gitSyncUpArgs,
        async callback() {

            const { 
                signalTemplate,
                vaultDepot, manIder, 
                committerName, hashDig,
                notifyEnable
            } = publishSignalArgs

            // mod vault manifest
            const vManIO = manifestJsonIO(vaultDepot, manIder)
            const signalType = signalTemplate["type"]

            // setup push depot
            // check pusher
            const pushDepot = pushRepoOps["repodir"]
            const rManIO = manifestJsonIO(pushDepot, manIder)
            if (!checkPusher(manIder, rManIO)) { 
                return "abort" as gitSyncUpCallbackReturn
            }

            signal = signalTemplate;
            modifyObaSyncManifest({
                manJIO: vManIO,
                manIder,
                userName: committerName,
                onmod(manContent: ObaSyncManifest) {
                    // new
                    // 'type': string,
                    
                    // 'creator.timestamp'?: string,
                    signalTemplate['creator.timestamp'] = 
                        signalTemplate?.['creator.timestamp'] ||
                        utcTimeTag()
                    // 'creator.hashKey'?: string,
                    const hashKey = signalTemplate['creator.hashKey'] = 
                        signalTemplate?.['creator.hashKey'] ||
                        _signalHashKey(signalType, ...hashDig)
                        // _signalHashKey(committerName, channelName, signalType, ...hashDig)
                        // NOTE: this was creating |committerNames| x |channelNames| x |signalTypes|
                        // 'different' signals
                        // If you want a signal to be unique per committerNames and channelNames
                        // you can just add it to hashDig
                    // 'creator.name'?: string,
                    signalTemplate['creator.name'] = 
                        signalTemplate?.['creator.name'] ||
                        committerName
                    // 'creator.channelName'?: string,
                    signalTemplate['creator.channelName'] = 
                        signalTemplate?.['creator.channelName'] ||
                        manIder["channelName"]

                    // 'committer.name'?: string,
                    signalTemplate['committer.name'] = committerName
                    // 'committer.timestamp'?: string,
                    signalTemplate['committer.timestamp'] = utcTimeTag()
                    // 'committer.channelName'?: string,
                    signalTemplate['committer.channelName'] = manIder["channelName"]

                    // add to signals
                    manContent['signals'] = manContent?.['signals'] || {}
                    manContent['signals'][hashKey] = signalTemplate
                    return signalTemplate
                },
            })
            

            // callback
            const publishCallback = publishSignalArgs?.["callback"]
            if (publishCallback) {
                const flag = await publishCallback()
                if (flag == "abort") { 
                    return "abort" as gitSyncUpCallbackReturn
                }
            }

            // copy vault manifest to push depot
            console.log(`Copying manifests`)
            const srcManFile = vManIO.retFile()
            const destManFile = rManIO.retFile()
            copyFileSync(srcManFile, destManFile)
            console.log(`Copied ${srcManFile} -> ${destManFile}`)
            console.log(`vaultMan: `, vManIO.loadd({}).retDepot())
            console.log(`pulledMan: `, rManIO.loadd({}).retDepot())

            if (notifyEnable) { 
                const msg = [
                    `Signal committed`,
                    ` - type: ${signal["type"]}`,
                    ` - committer.name: ${signal["committer.name"]}`,
                    ` - committer.channelName: ${signal["committer.channelName"]}`,
                    ` - creator.hashKey: ${signal["creator.hashKey"]}`,
                    ` - creator.name: ${signal["creator.name"]}`,
                    ` - creator.channelName: ${signal["creator.channelName"]}`,
                    ` - creator.timestamp: ${signal["creator.timestamp"]}`,
                        ].join("\n")
                        console.log(msg)
                console.log('Committed signal: ', signal)
                new Notice(msg, 1 * 60 * 1000)
            }
        },
    })
    return signal
}

// MARK: syncUpAllChannels
export async function syncUpAllChannels(
    syncUpAllChannelsArgs
: Omit<
    UnionParam<typeof gitSyncUp>, 
    'repoOps'
>) {

    addDefaults(syncUpAllChannelsArgs, {
        commitMsg: "syncUpAllChannels",
        cloneEnable: true,
        rmRepoEnable: true,
        commitEnable: true,
        pushEnable: true,
        addEnable: true,
        dummyText: "syncUpAllChannels",
        timeoutMs: 20 * 1000,
        rollTimeOut: true,
    })

    const channelsConfig = getObaSyncAllChannelsConfig({})
    for (const channelName in channelsConfig) {
        console.log("channelName: ", channelName)
        const channelConfig = channelsConfig[channelName]
        const pushRepoConfig = channelConfig["push.depot"]
        console.log("pushRepoConfig: ", pushRepoConfig)
        await gitSyncUp({
            repoOps: pushRepoConfig, 
            ...syncUpAllChannelsArgs
        })
    }
}