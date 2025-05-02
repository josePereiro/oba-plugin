import { OBA } from "src/oba-base/globals";
import { checkEnable, tools } from "src/tools-base/0-tools-modules";

export function onload() {

    console.log("SciHub:onload")

    // TODO/ link with Oba.jsonc
    // TODO/ improve this
    OBA.addCommand({
        id: "oba-scihub-fetch-selected-doi",
        name: "SciHub fetch selected doi",
        callback: async () => {
            checkEnable("scihub", {err: true, notice: true})
            console.clear()
            const sel = getSelectedText()
            await fetchPdfFromSciHubWithCurl(sel)
        },
    });
}


import { exec, execSync } from 'child_process';
import { readFileSync, unlinkSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { filesys } from "src/oba-base/0-oba-modules";
import { Notice } from "obsidian";
import { getSelectedText } from "src/tools-base/obsidian-tools";

async function fetchViaCurl(sciHubUrl: string): Promise<string> {
    // Create a temporary file path
    const schubdir = filesys.getObaDir(`scihub`)
    const resFile = join(schubdir, `scihub-res.html`);
    
    try {
        // Execute curl and save to temp file
        const command = `curl -s -L "${sciHubUrl}" -o "${resFile}"`;
        execSync(`curl -s -L "${sciHubUrl}" -o "${resFile}"`);
        // await exec(command, (error, stdout, stderr) => {
        //         if (error) {
        //             console.log(`Error: ${error.message}`);
        //         }
        //         if (stdout) {
        //             console.log(`Stdout: ${stdout}`);
        //         }
        //         if (stderr) {
        //             console.log(`Stderr: ${stderr}`);
        //         }
        //         console.log(`Executed: ${command}`);
        //     });
        // Read the file back
        const content = readFileSync(resFile, 'utf-8');
        // console.log("content: ", content)
        
        return content;
    } catch (error) {
        throw new Error(`CURL request failed: ${error instanceof Error ? error.message : String(error)}`);
    } 
}

// Updated Sci-Hub PDF fetcher using curl
async function fetchPdfFromSciHubWithCurl(doi: string) {
    const sciHubUrl = `https://sci-hub.se/${doi}`;
    
    try {
        const html = await fetchViaCurl(sciHubUrl);
        
        // Extract PDF URL (same as before)
        const pdfUrlMatch = html.match(/<iframe src="(.*?)"/i) || html.match(/location\.href='(.*?)'/i);
        
        if (pdfUrlMatch && pdfUrlMatch[1]) {
            let pdfUrl = pdfUrlMatch[1];
            
            // Handle relative URLs
            if (!pdfUrl.startsWith('http')) {
                const baseUrl = new URL(sciHubUrl).origin;
                pdfUrl = baseUrl + pdfUrl;
            }
            console.log("pdfUrl: ", pdfUrl)

            // Fetch the PDF using curl again
            const schubdir = filesys.getObaDir(`scihub`)
            const pdfFile = join(schubdir, `scihub_pdf_${Date.now()}.pdf`);
            execSync(`curl -s -L "${pdfUrl}" -o "${pdfFile}"`);
            console.log("pdfFile: ", pdfFile)
            
            // const pdfData = readFileSync(pdfFile);
            // return new Blob([pdfData], { type: 'application/pdf' });
        }
    } catch (error) {
        console.error('Error fetching from Sci-Hub:', error);
    }
}

// Usage example
// fetchPdfFromSciHubWithCurl('10.1038/nature12373')
//     .then(pdfBlob => {
//         if (pdfBlob) {
//             // Do something with the PDF
//             const url = URL.createObjectURL(pdfBlob);
//             const a = document.createElement('a');
//             a.href = url;
//             a.download = 'paper.pdf';
//             a.click();
//         }
//     });