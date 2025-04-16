import { Notice } from "obsidian";
import { registerObaCallback } from "src/services-base/callbacks";
import { getCallbackContext } from "./manifests-base";

export function _serviceCallbacks() {
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