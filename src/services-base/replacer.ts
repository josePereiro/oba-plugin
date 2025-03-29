/*
    Add and interface for static replacements
    - for instance 
        - #!mdate -> modification date of the note
*/
import { existsSync, statSync } from "fs";
import { OBA } from "src/oba-base/globals";
import { processNoteByLines, tools } from "src/tools-base/0-tools-modules";
import { DateTime } from 'luxon';
import { obanotes } from "./0-servises-modules";
import { TFile } from "obsidian";

export function onload() {
    console.log("Replacer:onload");

    // TODO/ link with Oba.json
    // TODO/ improve this
    OBA.addCommand({
        id: "oba-replacer-replace all",
        name: "Replacer replace all",
        callback: async () => {
            console.clear()
            await runReplacer()
        },
    });
}

// TODO/TAI Move out
function _fileStatDate(path: string, statid: "atime" | "mtime" | "ctime", format: string) {
    if (!existsSync(path)) { return null; }
    const stats = statSync(path);
    const date = stats?.[statid];
    return DateTime.fromJSDate(new Date(date)).toFormat(format);    
}

export async function runReplacer() {
    // "yyyy:mm:dd-HH:MM:SS"
    const notePath = tools.getCurrNotePath()
    console.log("notePath: ", notePath)
    const noteTFile = tools.getCurrNote()
    console.log("noteTFile: ", noteTFile)

    await processNoteByLines(
        noteTFile, 
        (line: string) => {
            return line
                .replace(/{{mdate}}/g, _fileStatDate(notePath, "mtime", 'yyyy:MM:dd-HH:mm:ss'))
                .replace(/{{adate}}/g, _fileStatDate(notePath, "atime", 'yyyy:MM:dd-HH:mm:ss'))
                .replace(/{{cdate}}/g, _fileStatDate(notePath, "ctime", 'yyyy:MM:dd-HH:mm:ss'))
                .replace(/{{gen-oba-id}}/g, obanotes.genObaNoteId())
                .replace(/#!mdate/g, _fileStatDate(notePath, "mtime", 'yyyy:MM:dd-HH:mm:ss'))
                .replace(/#!adate/g, _fileStatDate(notePath, "atime", 'yyyy:MM:dd-HH:mm:ss'))
                .replace(/#!cdate/g, _fileStatDate(notePath, "ctime", 'yyyy:MM:dd-HH:mm:ss'))
                .replace(/#!gen-oba-id/g, obanotes.genObaNoteId())
        }
    )
}