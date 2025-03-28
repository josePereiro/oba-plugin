import { Notice } from 'obsidian';
import { join } from 'path';
import { exec } from 'child_process';
import { platform } from "os";
import { existsSync } from 'fs';
import { OBA } from 'src/oba-base/globals';
import { tools } from 'src/tools-base/0-tools-modules';
import { obaconfig } from 'src/oba-base/0-oba-modules';

/*
    Given a path, open a pdf related with the note
*/

export function onload() {
    console.log("OpenPdf:onload");
    
    OBA.addCommand({
        id: "oba-pdfrepo-open-notes-pdf",
        name: "PDFRepo Open note's pdf",
        callback: () => {
            openPdfFromNote()
        },
    });
}

export function openPdfFromNote() {
    const activeFile = tools.getCurrNote();
    if (!activeFile) {
        new Notice("No active note found.");
        return;
    }

    // Get the note name without the file extension
    let noteName = activeFile.basename;
    noteName = noteName.replace("@", "");
    noteName = noteName.replace(".md", "");
    const pdfFileName = `${noteName}.pdf`;
    const pdfsDir = obaconfig.getObaConfig("local.pdfs.dir")
    const pdfFilePath = join(
        pdfsDir, pdfFileName
    );

    // Check exist
    if (!existsSync(pdfFilePath)) {
        new Notice(`Error: pdf file not found at ${pdfFilePath}`);
        return;
    }
    

    // Open the PDF in the browser
    console.log(pdfFilePath)
    
    const os = platform();
    let command;
    if (os === 'linux') {
        command = `xdg-open "${pdfFilePath}"`; // Linux
    } else if (os === 'win32') {
        command = `start "" "${pdfFilePath}"`; // Windows
    } else if (os === 'darwin') {
        command = `open "${pdfFilePath}"`; // macOS
    } else {
        console.log('Running on an unknown os:', os);
    }

    if (!command) { return; }
    exec(command, (error, stdout, stderr) => {
        if (error) {
            new Notice(`Error: ${error.message}`);
            return;
        }
        if (stderr) {
            new Notice(`Stderr: ${stderr}`);
            return;
        }
        new Notice(`Opening PDF: ${pdfFileName}`);
    });
}