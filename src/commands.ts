import { Notice } from 'obsidian';
import ObA from './main';
import { exec } from 'child_process';

// TODO: DEPRECATE
export class Commands {
    constructor(private oba: ObA) {
        console.log("Commands:constructor");
    }

    // TODO Move to Service
    codeVaultCmd() {
        console.log(`codeVaultCmd`);
        const signalDelay = this.oba.configfile.readConfig("signal.delay", 300);
        setTimeout(() => { 
            
            // load config file
            const code = this.oba.configfile.readConfig("edit.vault.shell.cmd");
            if (typeof code !== 'string') {
                console.log(`Unformatted code section: `, code)
                return
            }
            
            //  run code
            exec(code, (error, stdout, stderr) => {
                if (error) {
                    console.log(`error: ${error.message}`);
                    return;
                }
                if (stderr) {
                    console.log(`stderr: ${stderr}`);
                    return;
                }
                console.log(`stdout: ${stdout}`);
            });					
            
        }, signalDelay);
    }
}