import { Notice } from 'obsidian';
import ObA from './main';

export class Callbacks {
    registry: { [key: string]: (() => void)[] };

    constructor(private oba: ObA) {
        console.log("Callbacks:constructor");
        this.registry = {};

        // TODO: make an interface with config file
        // TODO: Think about it.
		// - Im calling a callback in a callback 
		// -- Connect what to call where in the configuration
		// -- Maybe just to have an action repo
		// --- "callback.oba-signal" : ["signalBackendCmd", "gitCommitCmd"]
		// ---- You can just use bracket notation
        this.registerCallback(`callback.command.0`, 
			() => this.oba.backends.signalBackend(),
			() => this.oba.git.gitCommitCmd()
		)
        console.log(this.registry)

    }

    runCallbacks(key: string): void {
        console.clear();
        console.log(`runCallbacks:${key}`);
        const calls = this.getCallbacks(key, true);
        console.log(key)
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
        console.log('calls')
        console.log(calls)
        return calls;
    }

    registerCallback(key: string, ...fns: (() => void)[]): void {
        const calls = this.getCallbacks(key, true);
        fns.forEach((fn, _index) => {
            calls.push(fn); // Add the function to the array
        });
    }
}

