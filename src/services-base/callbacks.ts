import { Notice } from 'obsidian';
import { registerObaEventCallback } from 'src/scheduler-base/event-callbacks';
import { ObaSchedulerExecutionBlock, ObaSchedulerTask } from 'src/scheduler-base/scheduler-base';
import { backends, commands, vaultgit, replacer } from './0-servises-modules';

/*
    TODO/ Make it an Scheduler or use ObaScheduler itself
    - Use a task object
    - Add priority
*/ 
export type TObaCallback = ((...args: any[]) => void | Promise<void>)
export let CALLBACKS_REGISTRY: { [key: string]: TObaCallback[] };
export let LAST_CALLBACK: string;
export let CALLBACK_ARGS: any;

export function onload() {
    console.log("Callbacks:onload");

    CALLBACKS_REGISTRY = {};
    LAST_CALLBACK = ''
    CALLBACK_ARGS = null

    // TODO: make an interface with config file
    // - Inspire in vscode.snnipets  
    //  - "callback.oba-signal" : ["signalBackendCmd", "gitCommitCmd"]
    //      - You can just use bracket notation
    const blockID = commands.getCommandCallbackId(1);
    registerObaEventCallback({
        blockID, 
        async callback(
            task: ObaSchedulerTask, 
            execBlock: ObaSchedulerExecutionBlock
        ) {
            await backends.signalBackend()
            await replacer.runReplacer()
            await vaultgit.commitVaultGit()
        }
    })

    // registerObaCallback({
    //     callbackID: "callbacks.obauri.action", 
    //     async call() {
    //         if (!checkEnable("obauri", {err: false, notice: true})) { return; }
    //         console.clear()
    //         const params = getCallbackArgs()?.[0]
    //         if (!params) { return; }
    //         console.log("obauri.params:\n", params?.[0])
    //         // open "obsidian://oba-uri?vault=MetXVault&_file=2_notes%2F%40edwardsEscherichiaColiMG16552000.md&_line=13"
    //         await openNoteAtLine(params?.["_file"], params?.["_line"])
    //     }
    // })

    // console.log("registry:\n", CALLBACKS_REGISTRY)

}

export function registerObaCallback({
    callbackID,
    call,
    calls,
    _verbose = false
} : {
    callbackID: string, 
    call?: TObaCallback,
    calls?: TObaCallback[],
    _verbose?: boolean
}) {
    if(_verbose) console.error(`registerObaCallback:${callbackID}`)
    const callsv = getCallbacks(callbackID, true);
    if (call) {
        callsv.push(call); // Add the function to the array
    }
    if (calls) {
        for (const call of calls) {
            callsv.push(call); // Add the function to the array
        };
    }
}

export function getCallbackArgs() {
    return CALLBACK_ARGS
}

export async function runObaCallbacks({
    callbackID, 
    args = null,
    _verbose = false
} : {
    callbackID: string, 
    args?: any,
    _verbose?: boolean
}) {
    LAST_CALLBACK = callbackID;
    CALLBACK_ARGS = args;
    if(_verbose) console.error(`runObaCallbacks:${callbackID}`);
    const calls = getCallbacks(callbackID, true);
    for (const call of calls) {
        try {
            await call(args); // Execute each function
        } catch (err) {
            new Notice(`Failed callback "${callbackID}" run: ${err.message}`);
            console.error(err);
        }
    }
    // reset
    CALLBACK_ARGS = null
}

export function getCallbacks(key: string, mk = false): TObaCallback[] {
    if (!mk) { return CALLBACKS_REGISTRY?.[key] }
    return CALLBACKS_REGISTRY[key] = CALLBACKS_REGISTRY?.[key] ?? [];
}



