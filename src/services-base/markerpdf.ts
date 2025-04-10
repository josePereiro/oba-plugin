import { existsSync } from 'fs';
import { basename, join } from 'path';
import { Notice } from 'obsidian';
import { OBA } from 'src/oba-base/globals';
import { tools } from 'src/tools-base/0-tools-modules';
import { vscode } from './0-servises-modules';
import { obaconfig } from 'src/oba-base/0-oba-modules';
import { getCurrNotePath } from 'src/tools-base/obsidian-tools';

/*
    Integration with marker pdf.
    Convert pdf documents into .md documents.
*/

export function onload() {
    console.log("MarkerPDF:onload");

    OBA.addCommand({
        id: "oba-markerpdf-open-note-md",
        name: "MarkerPDF open notes md",
        callback: () => {
            console.clear()
            openNoteMD()
        },
    });
}

/*
    Open marker note directory in vscode
*/ 
export function openNoteMD() {
    const notePath = getCurrNotePath();
    const noteName = basename(notePath).
        replace("@", "").
        replace(".md", "")
    const markerDir = getMarkerDir();
    const mdPath = join(
        markerDir, noteName, `${noteName}.md`
    )
    if (!existsSync(mdPath)) {
        const errorMsg = `File not found, ${mdPath}`
        new Notice(`ERROR: ${errorMsg}`);
        throw {msg: errorMsg};
    }
    vscode.goto(mdPath)
}

export function getMarkerDir() {
    const path = obaconfig.getObaConfig("markerpdf.dir")
    if (existsSync(path)) { return path; }
    const errorMsg = `"markerpdf.dir" config not found!!!`
    new Notice(`ERROR: ${errorMsg}`);
    throw {msg: errorMsg};
}