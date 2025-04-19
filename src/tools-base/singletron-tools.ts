/*
    Ensure a given task to be called only is a previous one is finished
*/
import { runObaCallbacks } from "src/services-base/callbacks";

 

const SINGLETRON_REG: {[keys: string]: string} = {}

export async function singleCall(
    id: string,
    call: (() => any),
    dflt: any = null
) {
    const status = SINGLETRON_REG?.[id] || null
    if (status == 'running') { 
        const callbackID = `${id}.running`;
        await runObaCallbacks(callbackID)
        return dflt; 
    }
    try {
        await call()
    } finally {
        SINGLETRON_REG[id] = 'idle'
        const callbackID = `${id}.finally`;
        await runObaCallbacks(callbackID)
    }
}