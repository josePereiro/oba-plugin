import { exec } from 'child_process';
import { Notice } from 'obsidian';
import { OBA } from 'src/oba-base/globals';
import { checkEnable } from 'src/tools-base/0-tools-modules';
import { getCurrNotePath, getCursorPosition } from 'src/tools-base/obsidian-tools';
import { obaconfig } from '../oba-base/0-oba-modules';
import { addObaCommand } from 'src/oba-base/commands';

/*
    Handle integration with vscode
*/ 
export function onload() {
    console.log("VSCode:onload")

    // TODO/ add check in case workspace config is missing
    addObaCommand({
        commandName: "open workspace",
        serviceName: ["VSCode"],
        async commandCallback({ commandID, commandFullName }) {
            console.clear()
            vscodeCall()
        },
    })

    addObaCommand({
        commandName: "goto position",
        serviceName: ["VSCode"],
        async commandCallback({ commandID, commandFullName }) {
            console.clear()
            const path = getCurrNotePath();
            const cursor = getCursorPosition();
            vscodeGotoFile(path, cursor.line, cursor.ch)
        },
    })

}

export function vscodeCall(args = "") {
    const vscode = obaconfig.getObaConfig("vscode.exec", "code")
    const wrokspace = obaconfig.getObaConfig("vscode.oba.workspace", "")
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

export function vscodeGotoFile(path: string, line = 0, ch = 0) {
    console.log("path: ", path)
    vscodeCall(`--goto "${path}":${line+1}:${ch+1}`)
}

export function vscodeOpenFolder(path: string) {
    console.log("path: ", path)
    vscodeCall(path)
}