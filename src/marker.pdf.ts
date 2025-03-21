import { existsSync } from 'fs';
import ObA from './main';
import { basename, join } from 'path';
import { Notice } from 'obsidian';

/*
    Integration with marker pdf.
    Convert pdf documents into .md documents.
*/
export class MarkerPDF {

    constructor(private oba: ObA) {
        console.log("MarkerPDF:constructor");

        this.oba.addCommand({
            id: "markerpdf-open-note-md",
            name: "MarkerPDF open note md",
            callback: () => {
                console.clear()
                this.openNoteMD()
            },
        });
    }

    /*
        Open marker note directory in vscode
    */ 
    openNoteMD() {
        const notePath = this.oba.tools.getCurrNotePath();
        const noteName = basename(notePath).
            replace("@", "").
            replace(".md", "")
        const markerDir = this.getMarkerDir();
        const mdPath = join(
            markerDir, noteName, `${noteName}.md`
        )
        if (!existsSync(mdPath)) {
            const errorMsg = `File not found, ${mdPath}`
            new Notice(`ERROR: ${errorMsg}`);
            throw {msg: errorMsg};
        }
        this.oba.vscode.goto(mdPath)
    }

    getMarkerDir() {
        const path = this.oba.configfile.getConfig("markerpdf.dir")
        if (existsSync(path)) { return path; }
        const errorMsg = `"markerpdf.dir" config not found!!!`
        new Notice(`ERROR: ${errorMsg}`);
        throw {msg: errorMsg};
    }

}