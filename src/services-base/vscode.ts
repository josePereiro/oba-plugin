import { Notice } from 'obsidian';
import { exec } from 'child_process';
import { OBA } from 'src/oba-base/globals';
import { obaconfig } from '../oba-base/0-oba-modules'
import { tools } from 'src/tools-base/0-tools-modules';

/*
    Handle integration with vscode
*/ 
export function onload() {
    console.log("VSCode:onload")

    OBA.addCommand({
        id: "oba-vscode-open-workspace",
        name: "VSCode open workspace",
        callback: () => {
            console.clear()
            call()
        },
    });

    OBA.addCommand({
        id: "oba-vscode-goto-position",
        name: "VSCode goto position",
        callback: () => {
            console.clear()
            const path = tools.getCurrNotePath();
            const cursor = tools.getCursorPosition();
            goto(path, cursor.line, cursor.ch)
        },
    });

}

export function call(args = "") {
    const vscode = obaconfig.getObaConfig("vscode.exec", "code")
    const wrokspace = obaconfig.getObaConfig("vscode.workspace", "")
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

export function goto(path: string, line = 0, ch = 0) {
    console.log("path: ", path)
    call(`--goto "${path}":${line+1}:${ch+1}`)
}