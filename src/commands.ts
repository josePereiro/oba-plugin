import ObA from './main';

// TODO: DEPRECATE
export class Commands {
    
    constructor(private oba: ObA) {
        console.log("Commands:constructor");

        for (let i = 0; i < 10; i++) {
            this.oba.addCommand({
                id: `oba-command-${i}`,
                name: `Command ${i}`,
                callback: () => {
                    // console.clear();
                    this.oba.callbacks.runCallbacks(`callback.command.${i}`)
                }
            });
        }
    }

}