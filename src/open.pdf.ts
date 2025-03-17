// DeepSeek
import { Notice } from 'obsidian';
import ObA from './main';
import { join } from 'path';
import { exec } from 'child_process';
import { platform } from "os";
import { existsSync } from 'fs';

/*
    Given a path, open a pdf related with the note
*/
export class OpenPdf {

    constructor(private oba: ObA) {
        console.log("OpenPdf:constructor");
        
        this.oba.addCommand({
            id: "open-pdf-from-note",
            name: "Open PDF from Note",
            callback: () => this.openPdfFromNote(),
        });
    }

    async openPdfFromNote() {
        const activeFile = this.oba.app.workspace.getActiveFile();

        if (!activeFile) {
            new Notice("No active note found.");
            return;
        }

        // pdfdir = getstate("local.pdfs.dir", nothing)
        // isnothing(pdfdir) && return :continue
        // url = "file://" * joinpath(pdfdir, "$name.pdf")

        // Get the note name without the file extension
        let noteName = activeFile.basename;
        noteName = noteName.replace("@", "");
        noteName = noteName.replace(".md", "");
        const pdfFileName = `${noteName}.pdf`;
        const pdfsDir = this.oba.configfile.getConfig("local.pdfs.dir")
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

}