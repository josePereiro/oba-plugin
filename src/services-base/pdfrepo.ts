import { Notice, TFile } from 'obsidian';
import { join } from 'path';
import { exec } from 'child_process';
import { platform } from "os";
import { existsSync } from 'fs';
import { OBA } from 'src/oba-base/globals';
import { checkEnable, tools } from 'src/tools-base/0-tools-modules';
import { obaconfig } from 'src/oba-base/0-oba-modules';
import { BiblIOIder } from 'src/biblio-base/biblio-data';
import { getCurrNote, getSelectedText } from 'src/tools-base/obsidian-tools';
import { addObaCommand } from 'src/oba-base/commands';

/*
    Given a path, open a pdf related with the note.
    TODO/ Move to citnote
*/

/*
    /TODO Move out
    TODO/DONE Create a validate for command method
    - validate arguments and notify user
    - Just a basic dev tool
    - validateForCommand
*/ 
export function validateCommandContext(obj: any) {
    const nully: string[] = []
    for (const key in obj) {
        if (!obj[key]) nully.push(key)
    }

    if (nully.length == 0) return true;
    new Notice([
        "💔 Invalid command context:\n",
        "- nully variables: ", nully.join(", ")
    ].join(""), 1000)
    return false
}

// TODO/ Rename to PDF Depot
export function onload() {
    console.log("PDFRepo:onload");

    addObaCommand({
        commandName: "open note's pdf",
        serviceName: ["PDFRepo"],
        async commandCallback({ commandID, commandFullName }) {
            console.clear()
            const note = getCurrNote()
            openPdfFromNote(note)
        },
    })
    
    addObaCommand({
        commandName: "check note's pdf",
        serviceName: ["PDFRepo"],
        async commandCallback({ commandID, commandFullName }) {
            console.clear()
            const sel = getSelectedText();
            const isValid = validateCommandContext({sel})
            if (!isValid) { return; }
            
            // Check exist
            const pdfFilePath = obaNotePdfFileName(sel)
            if (existsSync(pdfFilePath)) {
                new Notice(`👍 PDF file found at ${pdfFilePath}`);
            } else {
                new Notice(`💔 PDF file NOT found at ${pdfFilePath}`);
            }
        },
    })
}


function obaNotePdfFileName(name: string) {
    name = name.replace("@", "");
    name = name.replace(".md", "");
    const pdfFileName = `${name}.pdf`;
    const pdfsDir = obaconfig.getObaConfig("local.pdfs.dir")
    const pdfFilePath = join(pdfsDir, pdfFileName);
    return pdfFilePath
}

export function openPdfFromNote(
    note: TFile | null
) {
    if (!note) {
        new Notice("No active note found.");
        return;
    }

    // Get the note name without the file extension
    let noteName = note.basename;
    noteName = noteName.replace("@", "");
    noteName = noteName.replace(".md", "");
    const pdfFileName = `${noteName}.pdf`;
    const pdfsDir = obaconfig.getObaConfig("local.pdfs.dir")
    const pdfFilePath = join(
        pdfsDir, pdfFileName
    );

    // Check exist
    if (!existsSync(pdfFilePath)) {
        new Notice(`⚠️ Error: pdf file not found at ${pdfFilePath}`);
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