import { Notice } from 'obsidian';
import { backends, commands, git } from './0-servises-modules';
import { tools } from 'src/tools-base/0-tools-modules';

/*
    TODO: Add priority
*/ 
export let CALLBACKS_REGISTRY: { [key: string]: (() => void)[] };
export let LAST_CALLBACK: string;
export let CALLBACK_ARGS: any[];

export function onload() {
    console.log("Callbacks:onload");

    CALLBACKS_REGISTRY = {};
    LAST_CALLBACK = ''
    CALLBACK_ARGS = []

    // TODO: make an interface with config file
    // - Inspire in vscode.snnipets  
    //  - "callback.oba-signal" : ["signalBackendCmd", "gitCommitCmd"]
    //      - You can just use bracket notation
    const callid = commands.getCommandCallbackId(1);
    this.registerCallback(callid, 
        () => backends.signalBackend(),
        () => git.gitCommitCmd()
    )

    this.registerCallback(
        "callbacks.obauri.action", async () => {
            console.clear()
            const params = getCallbackArgs()?.[0]
            if (!params) { return; }
            console.log("obauri.params:\n", params?.[0])
            // open "obsidian://oba-uri?vault=MetXVault&_file=2_notes%2F%40edwardsEscherichiaColiMG16552000.md&_line=13"
            await tools.openNoteAtLine(params?.["_file"], params?.["_line"])
        }
    )

    console.log("registry:\n", CALLBACKS_REGISTRY)

}

export function registerCallback(key: string, ...fns: (() => void)[]): void {
    const calls = getCallbacks(key, true);
    fns.forEach((fn, _index) => {
        calls.push(fn); // Add the function to the array
    });
}

export function getCallbackArgs() {
    return CALLBACK_ARGS
}

export function runCallbacks(key: string, ...args: any[]): void {
    LAST_CALLBACK = key;
    CALLBACK_ARGS = args;
    console.clear();
    console.log(`runCallbacks:${key}`);
    const calls = getCallbacks(key, true);
    console.log(calls)
    for (const call of calls) {
        try {
            call(); // Execute each function
        } catch (err) {
            new Notice(`Failed callback "${key}" run: ${err.message}`);
            console.error(err);
        }
    }
    // reset
    CALLBACK_ARGS = null
}

export function getCallbacks(key: string, mk = false): (() => void)[] {
    if (!mk) { return CALLBACKS_REGISTRY?.[key] }
    const calls = CALLBACKS_REGISTRY?.[key] ?? [] as (() => void)[];
    CALLBACKS_REGISTRY[key] = calls;
    return calls;
}



