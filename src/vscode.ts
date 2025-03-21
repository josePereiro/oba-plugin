import { Notice } from 'obsidian';
import ObA from './main';
import { exec } from 'child_process';

/*
    Handle integration wit vscode
*/ 
export class VSCode {
    constructor(private oba: ObA) {
        console.log("VSCode:constructor")

        this.oba.addCommand({
            id: "vscode-open-workspace",
            name: "VSCode open workspace",
            callback: () => {
                console.clear()
                this.callVsCode()
            },
        });

        this.oba.addCommand({
            id: "vscode-goto-position",
            name: "VSCode goto position",
            callback: () => {
                console.clear()
                const path = this.oba.tools.getCurrNotePath();
                const cursor = this.oba.tools.getCursorPosition();
                this.goto(path, cursor.line, cursor.ch)
            },
        });

    }

    callVsCode(args = "") {
        const vscode = this.oba.configfile.getConfig("vscode.exec", "code")
        const wrokspace = this.oba.configfile.getConfig("vscode.workspace", "")
        const command = `${vscode} ${wrokspace} ${args}`;
        console.log("command:\n", command);
        exec(command, (error, stdout, stderr) => {
            if (error) {
                new Notice(`Error: ${error.message}`);
            }
            if (stdout) {
                console.log(`Stdout: ${stdout}`);
            }
            if (stderr) {
                new Notice(`Stderr: ${stderr}`);
            }
            new Notice(`Executed: ${command}`);
        });
    }

    goto(path: string, line = 0, ch = 0) {
        console.log("path: ", path)
        this.callVsCode(`--goto "${path}":${line+1}:${ch+1}`)
    }
}