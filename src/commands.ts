import ObA from './main';

/*
    General purpose commands.
    - The commands use callbacks so other servises can use them as entry point
    - Also it is useful for bundling commands 
*/
export class Commands {
    ncommands = 10;
    
    constructor(private oba: ObA) {
        console.log("Commands:constructor");

        for (const i of this.getCommandRange()) {
            this.oba.addCommand({
                id: this.getCommandId(i),
                name: this.getCommandName(i),
                callback: () => {
                    // console.clear();
                    const callid = this.getCommandCallbackId(i);
                    this.oba.callbacks.runCallbacks(callid);
                }
            });
        }
    }

    getCommandRange() {
        return Array.from({ length: this.ncommands }, (_, i) => i + 1);
    }

    getCommandId(i: number) { return `oba-command-${i}` }
    getCommandIds(): string[] {
        const result: string[] = [];
        for (const i of this.getCommandRange()) {
            result.push(this.getCommandId(i));
        }
        return result;
    }

    getCommandName(i: number) { return `General Command ${i}` }
    getCommandNames(): string[] {
        const result: string[] = [];
        for (const i of this.getCommandRange()) {
            result.push(this.getCommandName(i));
        }
        return result;
    }

    getCommandCallbackId(i: number) { return `callback.command.${i}` }
    getCommandCallbackIds(): string[] {
        const result: string[] = [];
        for (const i of this.getCommandRange()) {
            result.push(this.getCommandCallbackId(i));
        }
        return result;
    }

}