import { Notice } from "obsidian";
import { registerObaCallback, runObaCallbacks } from "src/services-base/callbacks";
import { getCallbackContext } from "./manifests-base";
import { checkEnable } from "src/tools-base/oba-tools";
import { OBA } from "src/oba-base/globals";
import { getObaConfig } from "src/oba-base/obaconfig";
import { resolveObaSyncSignals, ObaSyncSignal, sendObaSyncSignal } from "./signals-base";
import { _d2rAddCommit, _d2rPush, _r2dPull } from "./channels-base";
import { getCurrNotePath, getVaultDir } from "src/tools-base/obsidian-tools";
import { statusbar } from "src/services-base/0-servises-modules";
import { _downloadFileVersionFromContext, _publishFileVersion } from "./syncFileSignal-base";
import { DelayManager, randstring } from "src/tools-base/utils-tools";
import path from "path";
import { singleCall } from "src/tools-base/singletron-tools";

const ANYMOVE_DELAY: DelayManager = 
    new DelayManager(1000, 1001, -1, -1) // no delay

// DONE/TAI: create per note delay manager
function _createPushDelayManager() {
    return new DelayManager(3000, 1000, 5000, -1)
}

let PUSH_DELAYS: {[keys: string]: DelayManager} = {}
const PUSHING_SET = new Set()
    
export function _serviceCallbacks() {
    
    if (!checkEnable("obasync", {err: false, notice: false})) { return; }
    let callbackID: string;

    // MARK: anymove
    OBA.registerEvent(
        OBA.app.workspace.on('editor-change', (...args) => {
            runObaCallbacks('__obasync.obsidian.anymove')
        })
    );
    OBA.registerEvent(
        OBA.app.workspace.on('file-open', (...args) => {
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
    OBA.registerDomEvent(window.document, "keyup", async () => {
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
    OBA.registerEvent(
        OBA.app.workspace.on('editor-change', async (editor, info) => {
            _autoPush()
        })
    );

    // MARK: resolve signals
    callbackID = `obasync.obsidian.anymove`
    registerObaCallback(
        callbackID, 
        async () => {
            return await singleCall(
                `${callbackID}.pullResolvePush`,
                async () => {
                    _pullResolvePush()
                }
            );
        }
    )

    // MARK: pull
    callbackID = `obasync.signal.missing.in.record0.or.newer:push`
    registerObaCallback(
        callbackID, 
        async () => {
            return await singleCall(
                callbackID,
                async () => {
                    console.clear()

                    const context = getCallbackContext()
                    if (!context) { return; }
                    const channelsConfig = getObaConfig("obasync.channels", null)
                    if (!channelsConfig) { return; }
                    const userName0 = getObaConfig("obasync.me", null)
                    if (!userName0) { return; }
                    
                    await _downloadFileVersionFromContext(context, channelsConfig,)
                }
            );
        }
    )

    // MARK: signals
    callbackID = `obasync.signal.missing.in.record0.or.newer:notice`
    registerObaCallback(
        callbackID, 
        async () => {
            return await singleCall(
                callbackID,
                async () => {
                    _handleNotice()
                }
            )
        }
    )
}

function _handleNotice() {
    const context = getCallbackContext()
    if (!context) { return; }
    const sender = context?.["userName1"]
    const msg = context?.['signal1Content']?.['msg']
    // TODO: find a better notification system
    new Notice(`${sender} says: ${msg}!`, 0)
    context["handlingStatus"] = 'ok'
    console.log("handle.notice.context: ", context)
}

async function _pullResolvePush() {

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
                    // Using a constant dummy for avoiding polluting the repo
                    _d2rAddCommit(pushDepot, "123")
                    _d2rPush(pushDepot)
                },
                () => {
                    // onOk
                    _d2rAddCommit(pushDepot, randstring())
                    _d2rPush(pushDepot)
                },
                () => {
                    // onUnknown
                },
                () => {
                    // onFailed
                }
            ) 
        }
    }
}

async function _autoPush() {
    // context
    // It is important we can take the context before potentially waiting
    const localFile = getCurrNotePath()

    // call context
    const callID = `${localFile}.autoPush`

    return await singleCall(
        callID,
        async () => {
            console.clear()
            
            // push context
            const localFileBaseName = path.basename(localFile)
            const userName0 = getObaConfig("obasync.me", null)
            const channelsConfig = getObaConfig("obasync.channels", {})

            // controlFlow
            PUSH_DELAYS[localFile] = PUSH_DELAYS?.[localFile] || _createPushDelayManager()
            const delayManager = PUSH_DELAYS[localFile]
            const flag = await delayManager
                .manageTime((elapsed: any) => {
                    // const conutdown = delayManager.delayTime - elapsed
                    // statusbar.setText(`pushing in: ${conutdown}`)
                    PUSHING_SET.add(localFileBaseName)
                    statusbar.setText(`pushing ${[...PUSHING_SET]}`)
                })
            if (flag == "notyet") { return }
            statusbar.setText('pushing')

            for (const channelName in channelsConfig) {
                await _publishFileVersion(localFile, channelName, userName0, channelsConfig)
            }

            // new Notice("NOTE PUSHED!")
            PUSHING_SET.delete(localFileBaseName)
            if (PUSHING_SET.size == 0) {
                statusbar.clear()
                statusbar.setText('Notes pushed!', true)
                await sleep(1000)
                statusbar.clear()
                statusbar.clear()
            }
        }
    )
}