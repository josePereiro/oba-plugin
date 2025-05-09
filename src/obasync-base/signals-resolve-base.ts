import { gitSyncDown } from "src/gittools-base/gitSyncDown"
import { gitSyncUp } from "src/gittools-base/gitSyncUp"
import { getObaConfig } from "src/oba-base/obaconfig"
import { runObaEventCallbacks } from "src/scheduler-base/event-callbacks"
import { getVaultGitConfig } from "src/services-base/vault.git"
import { UnionParam, addDefaults } from "src/tools-base/utils-tools"
import { manifestJsonIO, ObaSyncManifest } from "./manifests-base"
import { getObaSyncAllChannelsConfig, ObaSyncOneChannelConfig } from "./obasync-base"
import { ObaSyncEventCallbackContext, ObaSyncSignal } from "./signals-base"
import { utcTimeTag } from "./utils-base"
import { TagLogger } from "src/tools-base/dev-tools"
import { cloneDeep } from "lodash"
import { GitRepoOptions } from "src/gittools-base/gittools-base"
import { getVaultDir } from "src/tools-base/obsidian-tools"


// MARK: _resolveSignalControlArgs
// export interface _resolveSignalControlArgs {
//     commitVaultDepo: boolean,
//     pullVaultRepo: boolean,
//     notify: boolean
// }


// MARK: resolveSignalEventsArgs
// interface resolveSignalEventsArgs extends _resolveSignalControlArgs {
//     vaultDepot: string,
//     pushDepot: string,
//     pullDepot: string,
//     vaultUserName: string, 
//     channelName: string, 
//     manType: string
// }

// MARK: SignalEventCallbackArgs
export interface SignalEventCallbackArgs {
    context: ObaSyncEventCallbackContext, 
    eventID: ObaSyncEventID
}

// MARK: ObaSyncEventID
export type ObaSyncEventID =
    `obasync.vault.signal.missing` |
    `obasync.signals.both.ctimetags.present` | 
    `obasync.vault.signal.ctimetag.newer` | 
    `obasync.vault.signal.ctimetag.missing.or.newer` | 
    `obasync.signals.both.ctimetags.equal` | 
    `obasync.vault.signal.ctimetag.older` | 
    `obasync.vault.signal.ctimetag.missing.or.older` |
    `obasync.vault.signal.ctimetag.missing` | 
    `obasync.pulled.signal.ctimetag.missing` | 
    `obasync.signals.both.ctimetags.missing`


// MARK: resolveSignalEvents
/*
    Check manifests and run event callbacks
*/ 
export async function resolveSignalEvents(
    resolveSignalEventsArgs
: {
    vaultDepot: string,
    vaultUserName: string, 
    channelName: string, 
    manType: string,

    pushRepoOps: GitRepoOptions, 
    pullRepoSyncDownArgs: UnionParam<typeof gitSyncDown>, 
    vaultRepoSyncUpArgs?: UnionParam<typeof gitSyncUp>, 
}) {

    const taglogger = new TagLogger(["ObaSync", "resolveSignalEvents"])

    // sync args
    // By default, all offline
    const { pullRepoSyncDownArgs } = resolveSignalEventsArgs
    addDefaults(pullRepoSyncDownArgs, {
        cleanEnable: true,
        cloneEnable: false,
        cloneForce: false,
        fetchEnable: false,
        gcEnable: false, 
        mkRepoDirEnable: true,
        resetEnable: true,
        timeoutMs: 20 * 1000,
        rollTimeOut: true
    })
    taglogger.log({pullRepoSyncDownArgs})
    const pullRepoOps = pullRepoSyncDownArgs["repoOps"]
    const pullDepot = pullRepoOps["repodir"]
    await gitSyncDown(pullRepoSyncDownArgs)

    // TODO: make a vault sync up
    const { vaultRepoSyncUpArgs } = resolveSignalEventsArgs
    if (vaultRepoSyncUpArgs) {
        addDefaults(vaultRepoSyncUpArgs, {
            addEnable: true,
            commitEnable: true,
            commitMsg: `before.resolveSignalEvents - ${utcTimeTag()}`,
            rmRepoEnable: false,
            pushEnable: false,
            touchEnable: false,
            dummyText: "123",
            cloneEnable: false,
            cloneForce: false,
            mkRepoDirEnable: true,
            timeoutMs: 20 * 1000,
            rollTimeOut: true
        })
        await gitSyncUp(vaultRepoSyncUpArgs)
    }
    taglogger.log({vaultRepoSyncUpArgs})
    

    // pushRepoOps
    const {pushRepoOps, vaultDepot} = resolveSignalEventsArgs
    taglogger.log({vaultDepot})

    // load manifests
    const { vaultUserName, channelName, manType } = resolveSignalEventsArgs
    const manIder = { channelName, manType }
    taglogger.log({manIder})
    const vaultManJIO = manifestJsonIO(vaultDepot, manIder)
    const vaultMan: ObaSyncManifest = vaultManJIO.loaddOnDemand({}).retDepot()
    const vaultManSignals = vaultMan['signals'] = vaultMan?.['signals'] || {}
    taglogger.log({vaultManSignals})

    const pulledManJIO = manifestJsonIO(pullDepot, manIder)
    const pulledMan: ObaSyncManifest = pulledManJIO.loaddOnDemand({}).retDepot()
    const pulledUserName = pulledMan?.['meta']?.["userName"] || "JohnDoe"
    const pulledManSignals = pulledMan['signals'] = pulledMan?.['signals'] || {}
    taglogger.log({pulledManSignals})
    
    // handle issued signals
    let blockID;
    let eventID: ObaSyncEventID;

    for (const pulledSignalKey in pulledManSignals) {
        console.log("------------")
        taglogger.log({pulledSignalKey})
        
        // signal content
        const pulledSignal: ObaSyncSignal = pulledManSignals[pulledSignalKey]
        taglogger.log({pulledSignal})
        const pulledSignalType = pulledSignal['type']
        taglogger.log({pulledSignalType})
        
        // get record
        let vaultSignal = vaultManSignals?.[pulledSignalKey]
        taglogger.log({vaultSignal})

        // call context0
        const context0: ObaSyncEventCallbackContext = {
            manIder, vaultUserName, pulledUserName, 
            pulledSignalKey, pulledSignal, 
            vaultDepot, pullRepoOps, pushRepoOps
        }
        taglogger.log({context0})
        let context;

        // callback
        if (!vaultSignal) {
            // run callbacks
            context = cloneDeep(context0)
            eventID = context["eventID"] = `obasync.vault.signal.missing`
            blockID = `${eventID}:${pulledSignalType}`
            await runObaEventCallbacks({blockID, context})
            
            context = cloneDeep(context0)
            eventID = context["eventID"] = `obasync.vault.signal.ctimetag.missing.or.newer`
            blockID = `${eventID}:${pulledSignalType}`
            await runObaEventCallbacks({blockID, context})

            context = cloneDeep(context0)
            eventID = context["eventID"] = `obasync.vault.signal.ctimetag.missing.or.older`
            blockID = `${eventID}:${pulledSignalType}`
            await runObaEventCallbacks({blockID, context})
        }

        const vaultCTimeStampStr = vaultSignal?.['creator.timestamp']
        taglogger.log({vaultCTimeStampStr})
        const pulledCTimeStampStr = pulledSignal?.['creator.timestamp']
        taglogger.log({pulledCTimeStampStr})
        if (vaultCTimeStampStr && pulledCTimeStampStr) {

            const pulledCTimeStamp = new Date(pulledCTimeStampStr)
            taglogger.log({pulledCTimeStamp})
            const vaultCTimeStamp = new Date(vaultCTimeStampStr)
            taglogger.log({vaultCTimeStamp})

            // callback
            context = cloneDeep(context0)
            eventID = context["eventID"] = `obasync.signals.both.ctimetags.present`
            blockID = `${eventID}:${pulledSignalType}`
            await runObaEventCallbacks({blockID, context})

            // callback
            if (vaultCTimeStamp < pulledCTimeStamp) {
                // mine.newer
                context = cloneDeep(context0)
                eventID = context["eventID"] = `obasync.vault.signal.ctimetag.older`
                blockID = `${eventID}:${pulledSignalType}`
                await runObaEventCallbacks({blockID, context})

                context = cloneDeep(context0)
                eventID = context["eventID"] = `obasync.vault.signal.ctimetag.missing.or.older`
                blockID = `${eventID}:${pulledSignalType}`
                await runObaEventCallbacks({blockID, context})
            }
            // callback
            if (vaultCTimeStamp == pulledCTimeStamp) {
                // both.equal
                context = cloneDeep(context0)
                eventID = context["eventID"] = `obasync.signals.both.ctimetags.equal`
                blockID = `${eventID}:${pulledSignalType}`
                await runObaEventCallbacks({blockID, context})
            }
            // callback
            if (vaultCTimeStamp > pulledCTimeStamp) {
                // both.equal
                context = cloneDeep(context0)
                eventID = context["eventID"] = `obasync.vault.signal.ctimetag.newer`
                blockID = `${eventID}:${pulledSignalType}`
                await runObaEventCallbacks({blockID, context})
                
                context = cloneDeep(context0)
                eventID = context["eventID"] = `obasync.vault.signal.ctimetag.missing.or.newer`
                blockID = `${eventID}:${pulledSignalType}`
                await runObaEventCallbacks({blockID, context})
            }
        }

        // callback
        if (!vaultCTimeStampStr && pulledCTimeStampStr) {
            context = cloneDeep(context0)
            eventID = context["eventID"] = `obasync.vault.signal.ctimetag.missing`
            blockID = `${eventID}:${pulledSignalType}`
            await runObaEventCallbacks({blockID, context})
        }

        // callback
        if (vaultCTimeStampStr && !pulledCTimeStampStr) {
            context = cloneDeep(context0)
            eventID = context["eventID"] = `obasync.pulled.signal.ctimetag.missing`
            blockID = `${eventID}:${pulledSignalType}`
            await runObaEventCallbacks({blockID, context})
        }

        // callback
        if (!vaultCTimeStampStr && !pulledCTimeStampStr) {
            context = cloneDeep(context0)
            eventID = context["eventID"] = `obasync.signals.both.ctimetags.missing`
            blockID = `${eventID}:${pulledSignalType}`
            await runObaEventCallbacks({blockID, context})
        }
    } // for (const pulledSignalKey in man1Issued)

}

// MARK: resolveSignalEventsAllChannles
export async function resolveSignalEventsAllChannles(
    syncDownArgs
: Omit<
    UnionParam<typeof gitSyncDown>, 
    'repoOps' | 'callback'
>) {

    const taglogger = new TagLogger(["ObaSync", "resolveSignalEventsAllChannles"])
    taglogger.log()

    const channelsConfig = getObaSyncAllChannelsConfig({})
    const vaultUserName = getObaConfig("obasync.me", null)
    const vaultRepoOps = getVaultGitConfig()
    const vaultDepot = getVaultDir()
    for (const channelName in channelsConfig) {
        taglogger.log({channelName})
        const channelConfig = channelsConfig[channelName]
        const pullDepots = channelConfig?.["pull.depots"] || []
        const pushRepoOps = channelConfig["push.depot"]
        for (const pullDepotOps of pullDepots) {
            await resolveSignalEvents({
                vaultDepot,
                vaultUserName,
                channelName,
                manType: 'main', //TAI/ interfece with Oba.jsonc
                pushRepoOps,
                pullRepoSyncDownArgs: {
                    repoOps: pullDepotOps
                }, 
                vaultRepoSyncUpArgs: {
                    repoOps: vaultRepoOps
                }, 
            })
        }
    }
}
