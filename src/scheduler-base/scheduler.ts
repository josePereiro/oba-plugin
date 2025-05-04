import { _obascheduler_devCommands } from "./dev-commands";
import { startObaSeqCallbackLoop, stopObaSeqCallbackLoop } from "./seq-callbacks";

/*
    DOING: Move spawn to the new scheduling
*/ 
export function onload() {
    console.log("ObaScheduler:onload")

    startObaSeqCallbackLoop()
    
    _obascheduler_devCommands()
    
}

export function onunload() {
    console.log("ObaScheduler:onload")
    stopObaSeqCallbackLoop()
}