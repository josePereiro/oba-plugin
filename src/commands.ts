import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { Notice } from 'obsidian';
import { randstring } from './statics';
import ObA from './main';
import { exec } from 'child_process';

export class Commands {
    constructor(private oba: ObA) {
        console.log("constructor");
    }

    // MARK: signalBackend
    signalBackendCmd() {
        console.log("signalBackendCmd");
        const signalDelay = this.oba.tools.readConfig("signal.delay", 300);
		setTimeout(() => { 
            const rlen = this.oba.tools.readConfig("signal.rand.id.len", 8);
            const signal_id = randstring('O.', rlen)
            const signal_file = this.oba.tools.getObaSignalPath();
            const plugin_dir = this.oba.tools.getObaPluginDir();
            new Notice("Oba: backend signaled");
            if (!existsSync(plugin_dir)) {
                mkdirSync(plugin_dir, { recursive: true })
            }
            console.log("backend signaled. signal_file: ", signal_file)
            console.log("backend signaled. signal_id: ", signal_id)
            console.log("backend signaled. plugin_dir: ", plugin_dir)
            
            const notepath = this.oba.tools.getCurrNote()
            console.log("backend signaled. notepath: ", notepath)
            const triggerJSON = JSON.stringify({
                hash: signal_id, 
                path: notepath, 
            })
            console.log("backend signaled. triggerJSON: ", triggerJSON)
            writeFileSync(signal_file, triggerJSON)
        }, signalDelay);
	}

    codeVaultCmd() {
        console.log(`codeVaultCmd`);
        const signalDelay = this.oba.tools.readConfig("signal.delay", 300);
        setTimeout(() => { 
            
            // load config file
            const code = this.oba.tools.readConfig("edit.vault.shell.cmd");
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

    // MARK: git
    async gitCommitCmd() {
        const isRepo = await this.oba.gitService.isGitRepo();
        if (!isRepo) {
            new Notice('This vault is not a Git repository.');
            return;
        }

        await this.oba.gitService.commitToBranch();
    }
}