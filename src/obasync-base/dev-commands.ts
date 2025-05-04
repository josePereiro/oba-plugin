import { existsSync, copyFileSync } from "fs"
import { Notice } from "obsidian"
import path from "path"
import { gitSyncDown } from "src/gittools-base/gitSyncDown"
import { gitSyncUp } from "src/gittools-base/gitSyncUp"
import { addObaCommand } from "src/oba-base/commands"
import { getObaConfig } from "src/oba-base/obaconfig"
import { getVaultDir, getCurrNotePath } from "src/tools-base/obsidian-tools"
import { ObaChannelConfig } from "./obasync-base"

export function _gittools_devCommands() {

    // MARK: gitSyncDown ping file
    addObaCommand({
        commandName: "gitSyncDown ping file",
        serviceName: ["ObaSync", "Dev"],
        async commandCallback({ commandID, commandFullName }) {
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
        },
    })

    addObaCommand({
        commandName: "gitSyncUp ping files",
        serviceName: ["ObaSync", "Dev"],
        async commandCallback({ commandID, commandFullName }) {
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
        },
    })

    addObaCommand({
        commandName: "gitSyncUp current file with all",
        serviceName: ["ObaSync", "Dev"],
        async commandCallback({ commandID, commandFullName }) {
            console.clear()

            const vaultFile = getCurrNotePath()
            if (!vaultFile) {
                new Notice("ERROR: no note opened!!!")
            }
            const vaultFileName = path.basename(vaultFile)

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
                        const pushFile = path.join(pushRepoConfig['repodir'], vaultFileName)
                        if (!existsSync(vaultFile)) { return 'abort'; }
                        copyFileSync(vaultFile, pushFile)
                    }
                })
                new Notice(`gitSyncUp ${channelName}`)
                console.log("flag: ", flag)
            }
        },
    })

    addObaCommand({
        commandName: "gitSyncDown current file with all",
        serviceName: ["ObaSync", "Dev"],
        async commandCallback({ commandID, commandFullName }) {
            console.clear()
            
            const vaultFile = getCurrNotePath()
            if (!vaultFile) {
                new Notice("ERROR: no note opened!!!")
            }
            const vaultFileName = path.basename(vaultFile)

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
                    new Notice(`gitSyncDown ${channelName}`)
                    const pullFile = path.join(
                        pullDepotConfig['repodir'], vaultFileName
                    )
                    console.log("pullFile: ", pullFile)
                    if (!existsSync(pullFile)) { continue; }
                    copyFileSync(pullFile, vaultFile)

                }
            }
        },
    })
}