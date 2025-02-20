import { Notice } from 'obsidian';
import ObA from './main';

export class Callbacks {
    registry: { [key: string]: (() => void)[] };

    constructor(private oba: ObA) {
        console.log("Callbacks:constructor");
        this.registry = {};
    }

    runCallbacks(key: string): void {
        console.log(`runCallbacks:${key}`);
        const calls = this.getCallbacks(key);
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
        return calls;
    }

    registerCallback(key: string, ...fns: (() => void)[]): void {
        const calls = this.getCallbacks(key, true);
        fns.forEach((fn, _index) => {
            calls.push(fn); // Add the function to the array
        });
    }
}

