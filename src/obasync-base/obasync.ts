import { copyFileSync, existsSync } from "fs";
import path from "path";
import { gitSyncDown } from "src/gittools-base/gitSyncDown";
import { gitSyncUp } from "src/gittools-base/gitSyncUp";
import { GitRepoOptions } from "src/gittools-base/gittools-base";
import { OBA } from "src/oba-base/globals";
import { getObaConfig } from "src/oba-base/obaconfig";
import { getVaultDir } from "src/tools-base/obsidian-tools";
import { SequentialAsyncScheduler } from "src/tools-base/schedule-tools";
import { INTERVAL1_ID } from "./callbacks-base";
import { ObaChannelConfig, ObaSyncRepoConfig, setObaSyncFlag } from "./obasync-base";
import { Notice } from "obsidian";

/*
    /TODO/ add actions when clicking a notice
    /TODO/ publish in a manifest, the local state of repos...
    /TODO/ Make public (in pushRepo) log file for ObaSync stuff...
        - This can help improve troubleshooting...
*/ 

/*
    Main module to handle syncronization with other vaults
*/

export const ObaSyncScheduler = new SequentialAsyncScheduler();

export function onload() {
    console.log("ObaSync:onload");

    setObaSyncFlag(`online.mode`, true)

    // Order matter?
    // _serviceCommands()
    // _serviceCallbacks()
    
    ObaSyncScheduler.run()

    OBA.addCommand({
        id: "obasync-gitSyncDown-ping-file",
        name: "ObaSync gitSyncDown ping file",
        callback: async () => {
            console.clear()

            
            const channelsConfig = getObaConfig("obasync.channels", {})
            for (const channelName in channelsConfig) {
                console.log("channelName: ", channelName)
                const channelConfig: ObaChannelConfig = channelsConfig?.[channelName] || {}
                const pullDepots = channelConfig?.["pull.depots"] || []
                for (const pullDepotConfig of pullDepots) {
                    // bring larger Dev1
                    console.log("pullDepotConfig: ", pullDepotConfig)
                    const flag = await gitSyncDown({
                        repoOps: pullDepotConfig,
                        fetchEnable: true,
                        cloneEnable: true,
                        mkRepoDirEnable: true,
                        resetEnable: true,
                        gcEnable: false,
                        cleanEnable: true,
                        rmRepoEnable: true,
                        cloneForce: false
                    })
                    console.log("flag: ", flag)

                    const pingFileName = pullDepotConfig?.["pingFile"]
                    if (!pingFileName) {
                        new Notice(`ERROR: pingFile config missing, channelName: ${channelName}`)
                        return
                    }                    
                    const notesRelPath = getObaConfig("obanotes.notes.root.relpath", '')
                    const vaultFile = path.join(
                        getVaultDir(), notesRelPath, pingFileName
                    )
                    const pullFile = path.join(
                        pullDepotConfig['repodir'], pingFileName
                    )
                    console.log("pullFile: ", pullFile)
                    if (!existsSync(pullFile)) { continue; }
                    copyFileSync(pullFile, vaultFile)
                }
            }
        }
    })

    OBA.addCommand({
        id: "obasync-gitSyncUp-ping-files",
        name: "ObaSync gitSyncUp ping files",
        callback: async () => {
            console.clear()

            const channelsConfig = getObaConfig("obasync.channels", {})
            for (const channelName in channelsConfig) {
                console.log("channelName: ", channelName)
                const channelConfig: ObaChannelConfig = 
                    channelsConfig?.[channelName] || {}
                const pushRepoConfig = channelConfig["push.depot"]
                console.log("pushRepoConfig: ", pushRepoConfig)
                const flag = await gitSyncUp({
                    repoOps: pushRepoConfig,
                    cloneEnable: true,
                    mkRepoDirEnable: true,
                    rmRepoEnable: true,
                    addEnable: true,
                    pushEnable: true,
                    commitEnable: true,
                    touchEnable: true,
                    cloneForce: false,
                    callback() {

                        const pingFileName = pushRepoConfig?.["pingFile"]
                        if (!pingFileName) {
                            new Notice(`ERROR: pingFile config missing, channelName: ${channelName}`)
                            return
                        }                    
                        const notesRelPath = getObaConfig("obanotes.notes.root.relpath", '')
                        const vaultFile = path.join(
                            getVaultDir(), notesRelPath, pingFileName
                        )
                        const pushFile = path.join(
                            pushRepoConfig['repodir'], pingFileName
                        )
                        if (!existsSync(vaultFile)) { return 'abort'; }
                        copyFileSync(vaultFile, pushFile)
                    }
                })
                console.log("flag: ", flag)   
            }
        }
    })

}

export function onunload() {
    ObaSyncScheduler.stop()

    if (INTERVAL1_ID) {
        window.clearInterval(INTERVAL1_ID);
    }
}
