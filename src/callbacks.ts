import { Notice } from 'obsidian';
import ObA from './main-old';

/*
    TODO: Add priority
*/ 
export class Callbacks {
    registry: { [key: string]: (() => void)[] };
    lastCalled: string;

    constructor(private oba: ObA) {
        console.log("Callbacks:constructor");
        this.registry = {};
        this.lastCalled = ''

        // TODO: make an interface with config file
        // - Inspire in vscode.snnipets  
        //  - "callback.oba-signal" : ["signalBackendCmd", "gitCommitCmd"]
		//      - You can just use bracket notation
        const callid = this.oba.commands.getCommandCallbackId(1);
        this.registerCallback(callid, 
			() => this.oba.backends.signalBackend(),
			() => this.oba.git.gitCommitCmd()
		)
        console.log("registry:\n", this.registry)

    }

    registerCallback(key: string, ...fns: (() => void)[]): void {
        const calls = this.getCallbacks(key, true);
        fns.forEach((fn, _index) => {
            calls.push(fn); // Add the function to the array
        });
    }

    runCallbacks(key: string): void {
        this.lastCalled = key;
        console.clear();
        console.log(`runCallbacks:${key}`);
        const calls = this.getCallbacks(key, true);
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

    getCallbacks(key: string, mk = false): (() => void)[] {
        if (!mk) { return this.registry?.[key] }
        const calls = this.registry?.[key] ?? [] as (() => void)[];
        this.registry[key] = calls;
        return calls;
    }


}

