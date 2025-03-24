import { Notice } from 'obsidian';
import { backends, commands, git } from './0-servises-modules';

/*
    TODO: Add priority
*/ 
export let CALLBACKS_REGISTRY: { [key: string]: (() => void)[] };
export let LAST_CALLBACK: string;

export function onload() {
    console.log("Callbacks:onload");

    CALLBACKS_REGISTRY = {};
    LAST_CALLBACK = ''

    // TODO: make an interface with config file
    // - Inspire in vscode.snnipets  
    //  - "callback.oba-signal" : ["signalBackendCmd", "gitCommitCmd"]
    //      - You can just use bracket notation
    const callid = commands.getCommandCallbackId(1);
    this.registerCallback(callid, 
        () => backends.signalBackend(),
        () => git.gitCommitCmd()
    )
    console.log("registry:\n", CALLBACKS_REGISTRY)

}

export function registerCallback(key: string, ...fns: (() => void)[]): void {
    const calls = getCallbacks(key, true);
    fns.forEach((fn, _index) => {
        calls.push(fn); // Add the function to the array
    });
}

export function runCallbacks(key: string): void {
    LAST_CALLBACK = key;
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
}

export function getCallbacks(key: string, mk = false): (() => void)[] {
    if (!mk) { return CALLBACKS_REGISTRY?.[key] }
    const calls = CALLBACKS_REGISTRY?.[key] ?? [] as (() => void)[];
    CALLBACKS_REGISTRY[key] = calls;
    return calls;
}



