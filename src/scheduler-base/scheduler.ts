import { startObaSeqCallbackLoop, stopObaSeqCallbackLoop } from "./seq-callbacks";

export function onload() {
    console.log("ObaScheduler:onload")

    startObaSeqCallbackLoop()
}

export function onunload() {
    console.log("ObaScheduler:onload")
    stopObaSeqCallbackLoop()
}