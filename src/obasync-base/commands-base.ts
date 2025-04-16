import { OBA } from "src/oba-base/globals"
import { checkEnable } from "src/tools-base/oba-tools"
import { getObsSyncDir, getSyncChannelsConfig } from "./utils-base"
import { rm } from "fs/promises"
import { getCurrNotePath, getSelectedText } from "src/tools-base/obsidian-tools"
import { Notice } from "obsidian"
import { getObaConfig } from "src/oba-base/obaconfig"
import { resolveObaSyncSignals, ObaSyncSignal, sendObaSyncSignal } from "./signals-base"
import { _d2rPush, _r2dPull } from "./channels-base"
import { checkNotePublicStatus } from "./firewall-base"

export function _serviceCommands() {

    OBA.addCommand({
        id: "oba-obasync-rm-depot-obasync-dir",
        name: "ObaSync rm depot obasync dirs",
        callback: async () => {
            checkEnable("obasync", {err: true, notice: true})
            console.clear()
            const channelsConfig = getObaConfig("obasync.channels", {})
            for (const channelName in channelsConfig) {
                const channelConfig = channelsConfig?.[channelName] || {}
                const pushDepot = channelConfig?.["push.depot"] || null
                const pullDepots = channelConfig?.["pull.depots"] || []
                const dirs = [ pushDepot, ...pullDepots ]
                for (const dir of dirs) {
                    const obsSyncDir = getObsSyncDir(dir)
                    console.log('obsSyncDir: ', obsSyncDir)
                    await rm(obsSyncDir, { recursive: true, force: true })
                }
            }
        }
    })

    OBA.addCommand({
        id: "oba-obasync-dev",
        name: "ObaSync dev",
        callback: async () => {
            console.clear()
            const note = getCurrNotePath();
            const channelsConfig = getObaConfig("obasync.channels", {})
            let isPublic = false;
            for (const channelName in channelsConfig) {
                isPublic = isPublic || await checkNotePublicStatus(
                    note, channelName, channelsConfig
                )
            }
            new Notice(`Public status: ${isPublic}`)
        }
    })

    OBA.addCommand({
        id: "oba-obasync-send-notice-from-selected",
        name: "ObaSync send notice signal from selected",
        callback: async () => {
            checkEnable("obasync", {err: true, notice: true})
            console.clear()

            const userName0 = getObaConfig("obasync.me", null)
            const note = getCurrNotePath();
            
            const channelsConfig = getObaConfig("obasync.channels", {})
            for (const channelName in channelsConfig) {
                const channelConfig = channelsConfig?.[channelName] || {}
                const isPublic = await checkNotePublicStatus(note, channelName)
                if (!isPublic) { 
                    console.log("private note!");
                    continue; 
                }
                
                const sel = getSelectedText()
                if (!sel) {
                    new Notice("Nothing selected!")
                    return
                }
                const pushDepot = channelConfig?.["push.depot"] || null
                const signal0: ObaSyncSignal = {
                    "type": 'notice',
                    "msg": sel 
                }
                sendObaSyncSignal(pushDepot, userName0, 'main', signal0, [],
                    () => {
                        // preV2dPush
                        //// pull
                        _r2dPull(pushDepot)
                    }, 
                    () => {
                        // postV2dPush
                        //// push
                        _d2rPush(pushDepot)
                    }
                )
            }
        },
    });

    OBA.addCommand({
        id: "oba-obasync-handle-main-signals",
        name: "ObaSync handle main signals",
        callback: async () => {
            checkEnable("obasync", {err: true, notice: true})
            console.clear()

            const userName0 = getObaConfig("obasync.me", null)
            const channelsConfig = getObaConfig("obasync.channels", {})
            
            for (const channelName in channelsConfig) {
                const channelConfig = channelsConfig?.[channelName] || {}
                const pushDepot = channelConfig?.["push.depot"] || null
                const pullDepots = channelConfig?.["pull.depots"] || []
                for (const pullDepot of pullDepots) {
                    await resolveObaSyncSignals(
                        pushDepot, pullDepot, userName0, 'main',
                        () => {
                            // preD2vPull
                            _r2dPull(pullDepot)
                        },
                        () => {
                            // postD2vPull
                            _d2rPush(pushDepot)
                        }
                    ) 
                }
            }
        },
    });

}