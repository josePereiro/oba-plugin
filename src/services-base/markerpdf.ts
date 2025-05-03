import { existsSync } from 'fs';
import { Notice } from 'obsidian';
import path from 'path';
import { obaconfig } from 'src/oba-base/0-oba-modules';
import { addObaCommand } from 'src/oba-base/commands';
import { getCurrNotePath } from 'src/tools-base/obsidian-tools';
import { vscodeGotoFile, vscodeOpenFolder } from './vscode';

/*
    Integration with marker pdf.
    Convert pdf documents into .md documents.
*/

export function onload() {
    console.log("MarkerPDF:onload");

    addObaCommand({
        commandName: "open note md",
        serviceName: "MarkerPDF",
        async commandCallback({ commandID, commandFullName }) {
            console.clear()
            const notePath = getCurrNotePath();
            const mdPath = getMarkerMDFilePath({notePath})
            if (!existsSync(mdPath)) {
                const errorMsg = `File not found, ${mdPath}`
                new Notice(`ERROR: ${errorMsg}`);
                throw {msg: errorMsg};
            }
            vscodeGotoFile(mdPath)
        },
    })

    addObaCommand({
        commandName: "check note md",
        serviceName: "MarkerPDF",
        async commandCallback({ commandID, commandFullName }) {
            console.clear()
            const notePath = getCurrNotePath();
            const mdPath = getMarkerMDFilePath({notePath})
            if (existsSync(mdPath)) {
                new Notice(`👍 PDF file found at ${mdPath}`);
            } else {
                new Notice(`💔 PDF file NOT found at ${mdPath}`);
            }
        },
    })

    addObaCommand({
        commandName: "open marker folder",
        serviceName: "MarkerPDF",
        async commandCallback({ commandID, commandFullName }) {
            console.clear()
            const notePath = getMarkerDir()
            vscodeOpenFolder(notePath)
        },
    })
}

export function getMarkerMDFilePath({
    notePath,
}: {
    notePath: string,
}) {
    const noteName = path.basename(notePath)
        .replace("@", "")
        .replace(".md", "")
    const markerDir = getMarkerDir();
    return path.join(
        markerDir, noteName, `${noteName}.md`
    )
}

export function getMarkerDir() {
    const path = obaconfig.getObaConfig("markerpdf.dir")
    if (existsSync(path)) { return path; }
    const errorMsg = `"markerpdf.dir" config not found!!!`
    new Notice(`ERROR: ${errorMsg}`);
    throw {msg: errorMsg};
}