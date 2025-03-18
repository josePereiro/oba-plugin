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
            id: "vscode-open-at-position",
            name: "VSCode open at position",
            callback: () => {
                console.clear()
                const path = this.oba.tools.getCurrNotePath();
                const cursor = this.oba.tools.getCursorPosition();
                this.open(path, cursor.line, cursor.ch)
            },
        });
    }


    open(path: string, line: number, ch: number) {
        console.log("path: ", path)
        const vscode = this.oba.configfile.getConfig("vscode.exec", "code")
        const command = `${vscode} --goto "${path}":${line+1}:${ch+1}`;
        console.log("command:\n", command);
        exec(command, (error, stdout, stderr) => {
            if (error) {
                new Notice(`Error: ${error.message}`);
            }
            if (stderr) {
                new Notice(`Stderr: ${stderr}`);
            }
            new Notice(`Opening file: ${path}`);
        });
    }

}