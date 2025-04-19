import { Notice } from 'obsidian';
import { backends, commands, git, replacer } from './0-servises-modules';
import { checkEnable, tools } from 'src/tools-base/0-tools-modules';
import { crossref, localbibs } from 'src/biblio-base/0-biblio-modules';
import { citnotes } from 'src/citnotes-base/0-citnotes-modules';
import { openNoteAtLine } from 'src/tools-base/obsidian-tools';
import { _pushDepots } from 'src/obasync-base/commands-base';

/*
    TODO: Add priority
*/ 
export type TObaCallback = ((...args: any[]) => void | Promise<void>)
export let CALLBACKS_REGISTRY: { [key: string]: TObaCallback[] };
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
    registerObaCallback(callid, 
        // Order is relevant
        async () => await backends.signalBackend(),
        async () => await replacer.runReplacer(),
        async () => await git.gitCommitCmd(),
        async () => await _pushDepots(),
        // async () => await localbibs.parseOnDemandLocalBibAll(),
        // async () => await citnotes.downloadAllLocalReferences(),
    )

    registerObaCallback(
        "callbacks.obauri.action", async () => {
            if (!checkEnable("obauri", {err: false, notice: true})) { return; }
            console.clear()
            const params = getCallbackArgs()?.[0]
            if (!params) { return; }
            console.log("obauri.params:\n", params?.[0])
            // open "obsidian://oba-uri?vault=MetXVault&_file=2_notes%2F%40edwardsEscherichiaColiMG16552000.md&_line=13"
            await openNoteAtLine(params?.["_file"], params?.["_line"])
        }
    )

    console.log("registry:\n", CALLBACKS_REGISTRY)

}

export function registerObaCallback(key: string, ...fns: TObaCallback[]): void {
    console.error(`registerObaCallback:${key}`)
    const calls = getCallbacks(key, true);
    fns.forEach((fn, _index) => {
        calls.push(fn); // Add the function to the array
    });
}

export function getCallbackArgs() {
    return CALLBACK_ARGS
}

export async function runObaCallbacks(
    key: string, ...args: any[]
) {
    LAST_CALLBACK = key;
    CALLBACK_ARGS = args;
    console.error(`runObaCallbacks:${key}`);
    const calls = getCallbacks(key, true);
    for (const call of calls) {
        try {
            await call(...args); // Execute each function
        } catch (err) {
            new Notice(`Failed callback "${key}" run: ${err.message}`);
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



