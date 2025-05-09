import { getObaConfig } from "src/oba-base/obaconfig";
import { TagLogger } from "src/tools-base/dev-tools";
import { _handleDownloadFile, _registerModifiedFilesSignalHandler } from "./modifiedFileSignal-handle-base";
import { getObaSyncAllChannelsConfig } from "./obasync-base";
import { HandlingStatus, ObaSyncEventCallbackContext } from "./signals-base";
import { registerSignalEventHandler, SignalHandlerArgs } from "./signals-handle-base";
import { ObaSyncEventID } from "./signals-resolve-base";

export function _modifiedFileSignal_events_callbacks() {

    _registerModifiedFilesSignalHandler({
        eventID: 'obasync.vault.signal.ctimetag.missing.or.older'
    })

}

// MARK: _registerModifiedFilesSignalHandler
export function _registerModifiedFilesSignalHandler({
    eventID
}: {
    eventID: ObaSyncEventID
}) {

    const taglogger = new TagLogger(["ObaSync", "_registerModifiedFilesSignalHandler"])
    taglogger.loginit()

    const handlerName = getObaConfig("obasync.me", null)
    console.log({handlerName})
    if (!handlerName) { return; }
    // new signal available,
    registerSignalEventHandler({
        eventID: eventID, 
        handlerName,
        signalType: "modified.file", 
        blockGas: 1,
        taskIDDigFun: (
            context: ObaSyncEventCallbackContext
        ) => {
            // For doing unique the taskID
            const channelName = context["manIder"]["channelName"]
            const manType = context["manIder"]["manType"]
            const pulledSignalKey = context["pulledSignalKey"]
            return [channelName, manType, pulledSignalKey] as string[]
        },
        handler: async (args: SignalHandlerArgs ): Promise<HandlingStatus> => {
            taglogger.log("on.handler")

            const { context, eventID, execBlock } = args
            const channelsConfig = getObaSyncAllChannelsConfig({})
            taglogger.log({eventID})
            taglogger.log({channelsConfig})
            taglogger.log({context})
            taglogger.log({execBlock})
            
            // handle gas
            execBlock["blockGas"] = 0 // /TAI Do once

            // TODO/ fix defaults propagation
            // - Maybe a centralized named default center
            return await _handleDownloadFile({
                context,
                channelsConfig,
                gitSyncUpArgs: {} 
            })
        }
    })
}
