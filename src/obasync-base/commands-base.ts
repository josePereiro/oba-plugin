import { OBA } from "src/oba-base/globals"
import { checkEnable } from "src/tools-base/oba-tools"
import { getObsSyncDir, getSyncChannelsConfig } from "./utils-base"
import { rm } from "fs/promises"
import { getSelectedText } from "src/tools-base/obsidian-tools"
import { Notice } from "obsidian"
import { getObaConfig } from "src/oba-base/obaconfig"
import { handleObaSyncSignals, ObaSyncSignal, sendObaSyncSignal } from "./signals-base"
import { _d2rPush, _r2dPull } from "./channels-base"

export function _serviceCommands() {
    // MARK: commands
    OBA.addCommand({
        id: "oba-obasync-rm-depot-obasync-dir",
        name: "ObaSync rm depot obasync dirs",
        callback: async () => {
            checkEnable("obasync", {err: true, notice: true})
            console.clear()
            const pushDepot = getSyncChannelsConfig("TankeFactory", "push.depot", null)
            const pullDepots = getSyncChannelsConfig("TankeFactory", "pull.depots", [])
            const dirs = [ pushDepot, ...pullDepots ]
            for (const dir of dirs) {
                const obsSyncDir = getObsSyncDir(dir)
                console.log('obsSyncDir: ', obsSyncDir)
                await rm(obsSyncDir, { recursive: true, force: true })
            }
        }
    })

    OBA.addCommand({
        id: "oba-obasync-send-notice-from-selected",
        name: "ObaSync send notice signal from selected",
        callback: async () => {
            checkEnable("obasync", {err: true, notice: true})
            console.clear()
            const sel = getSelectedText()
            if (!sel) {
                new Notice("Nothing selected!")
                return
            }
            const pushDepot = getSyncChannelsConfig("TankeFactory", "push.depot", null)
            const userName0 = getObaConfig("obasync.me", null)
            const signal0: ObaSyncSignal = {
                "type": 'notice',
                "msg": sel 
            }
            sendObaSyncSignal(pushDepot, userName0, 'main', signal0) 
        },
    });

    OBA.addCommand({
        id: "oba-obasync-handle-main-signals",
        name: "ObaSync handle main signals",
        callback: async () => {
            checkEnable("obasync", {err: true, notice: true})
            console.clear()
            const pushDepot = getSyncChannelsConfig("TankeFactory", "push.depot", null)
            const pullDepots = getSyncChannelsConfig("TankeFactory", "pull.depots", [])
            const userName0 = getObaConfig("obasync.me", null)
            for (const pullDepot of pullDepots) {
                await handleObaSyncSignals(
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
        },
    });
}