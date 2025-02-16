import { Notice } from 'obsidian';
import ObA from './main';

export class Callbacks {

    constructor(private oba: ObA) {
        console.log("Callbacks:constructor");
    }

    runCallbacks(key: string): void {
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
        if (!mk) { return this.oba.callbacks?.[key] }
        const calls = this.oba.callbacks?.[key] ?? [] as (() => void)[];
        this.oba.callbacks[key] = calls;
        return calls;
    }

    registerCallback(key: string, fn: () => void): void {
        const calls = this.getCallbacks(key, true);
        calls.push(fn); // Add the function to the array
    }
}

