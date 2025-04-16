import { Notice } from "obsidian";
import { registerObaCallback, runObaCallbacks } from "src/services-base/callbacks";
import { getCallbackContext } from "./manifests-base";
import { checkEnable } from "src/tools-base/oba-tools";
import { OBA } from "src/oba-base/globals";
import { ANYMOVE_DELAY, PUSH_DELAY } from "./obasync-base";
import { getSyncChannelsConfig } from "./utils-base";
import { getObaConfig } from "src/oba-base/obaconfig";
import { resolveObaSyncSignals, ObaSyncSignal, sendObaSyncSignal } from "./signals-base";
import { _d2rPush, _r2dPull } from "./channels-base";
import { getCurrNotePath, getVaultDir } from "src/tools-base/obsidian-tools";
import { statusbar } from "src/services-base/0-servises-modules";
import path from "path";
import { copyFileSync, existsSync } from "fs";
import { checkNotePublicStatus } from "./firewall-base";

export function _serviceCallbacks() {
    
    if (!checkEnable("obasync", {err: false, notice: false})) { return; }

    // MARK: anymove
    // 'changed'
    OBA.registerEvent(
        OBA.app.workspace.on('editor-drop', (...args) => {
            runObaCallbacks('__obasync.obsidian.anymove')
        })
    );
    OBA.registerEvent(
        OBA.app.workspace.on('editor-change', (...args) => {
            runObaCallbacks('__obasync.obsidian.anymove')
        })
    );
    OBA.registerEvent(
        OBA.app.workspace.on('layout-change', (...args) => {
            runObaCallbacks('__obasync.obsidian.anymove')
        })
    );
    OBA.registerEvent(
        OBA.app.workspace.on('file-open', (...args) => {
            runObaCallbacks('__obasync.obsidian.anymove')
        })
    );
    OBA.registerEvent(
        OBA.app.workspace.on('active-leaf-change', (...args) => {
            runObaCallbacks('__obasync.obsidian.anymove')
        })
    );
    OBA.registerDomEvent(window.document, "wheel", () => {
        runObaCallbacks('__obasync.obsidian.anymove')
    });
    OBA.registerDomEvent(window.document, "mousemove", () => {
        runObaCallbacks('__obasync.obsidian.anymove')
    });
    OBA.registerDomEvent(window.document, "click", () => {
        runObaCallbacks('__obasync.obsidian.anymove')
    });

    registerObaCallback(
        `__obasync.obsidian.anymove`, 
        async () => {
            const now: Date = new Date()
            const flag = await ANYMOVE_DELAY.manageTime()
            if (flag == "go") { 
                await runObaCallbacks('obasync.obsidian.anymove')
            }
        }
    )

    // MARK: auto push
    OBA.registerDomEvent(window.document, "keyup", async () => {

        console.clear()

        // context data
        const localFile = getCurrNotePath();
        if (!localFile) { return; }
        if (!existsSync(localFile)) { return; }
        const localFileName = path.basename(localFile)

        const channelsConfig = getObaConfig("obasync.channels", {})
        const userName0 = getObaConfig("obasync.me", null)
        for (const channelName in channelsConfig) {
            const channelConfig = channelsConfig?.[channelName] || {}

            const isPublic = await checkNotePublicStatus(
                localFile,
                channelName,
            )
            if (!isPublic) { 
                console.log("private note!");
                return; 
            }
            const pushDepot = channelConfig?.["push.depot"] || null

            //  control flow
            const flag = await PUSH_DELAY
                .manageTime((elapsed: any) => {
                    const conutdown = PUSH_DELAY.delayTime - elapsed
                    statusbar.setText(`pushing in: ${conutdown}`)
                })
            if (flag == "notyet") { return }
            statusbar.setText('pushing')

            let signal0: ObaSyncSignal = { 
                "type": `push`,
                "fileName": localFileName,
                "channelName": channelName
            }

            runObaCallbacks('obasync.before.push')
            sendObaSyncSignal(
                pushDepot, userName0, 'main', signal0, [localFileName],
                () => {
                    // preV2dPush
                    
                    //// r2dPull
                    _r2dPull(pushDepot)
                    
                    //// copy
                    const destFile = path.join(pushDepot, localFileName)
                    copyFileSync(localFile, destFile)
                }, 
                () => {
                    // postV2dPush
                    //// d2rPush
                    _d2rPush(pushDepot)
                }
            ) 
            runObaCallbacks('obasync.after.push')

            // new Notice("NOTE PUSHED!")
            statusbar.clear()
            statusbar.setText('NOTE PUSHED!', true)
            await sleep(1000)
            statusbar.clear()
            statusbar.clear()
        }
    });

    // MARK: resolve signals
    registerObaCallback(
        `obasync.obsidian.anymove`, 
        async () => {
            const channelsConfig = getObaConfig("obasync.channels", {})
            const userName0 = getObaConfig("obasync.me", null)
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
        }
    )

    // MARK: auto pull
    registerObaCallback(
        `obasync.signal.missing.in.record0.or.newer:push`, 
        () => {
            const context = getCallbackContext()
            if (!context) { return; }
            const signal = context?.['signal1Content']
            const pullDepot = context?.['pullDepot0']
            console.log("push.signal: ", signal)
            console.log("pullDepot: ", pullDepot)
            const remoteFile = signal?.['fileName']
            const channelName = signal?.['channelName']
            const vaultDir = getVaultDir()
            const channelsConfig = getObaConfig("obasync.channels", {})
            const channelConfig = channelsConfig?.[channelName] || {}
            const relpath = channelConfig?.["pull.dest.folder.relpath"] || ''
            const destDir = path.join(vaultDir, relpath)
            console.clear()
            console.log("destDir: ", destDir)
            const srcPath = path.join(pullDepot, remoteFile)
            if (!existsSync(srcPath)) {
                context["handlingStatus"] = 'ok'
                new Notice(`srcPath missing! ${srcPath}!`)
                return
            }
            const destPath = path.join(destDir, remoteFile)
            console.log("destDir: ", destDir)
            console.log("srcPath: ", srcPath)
            console.log("destPath: ", destPath)
            copyFileSync(srcPath, destPath)

            new Notice(`pulled: ${remoteFile}!`)
            context["handlingStatus"] = 'ok'
            console.log("handle.push.context: ", context)
        }
    )

    // MARK: signals
    registerObaCallback(
        `obasync.signal.missing.in.record0.or.newer:notice`, 
        async () => {
            const context = getCallbackContext()
            if (!context) { return; }
            const sender = context?.["userName1"]
            const msg = context?.['signal1Content']?.['msg']
            // TODO: find a better notification system
            new Notice(`${sender} says: ${msg}!`)
            context["handlingStatus"] = 'ok'
            console.log("handle.notice.context: ", context)
        }
    )
}