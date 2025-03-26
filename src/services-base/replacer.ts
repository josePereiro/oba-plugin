/*
    Add and interface for static replacements
    - for instance 
        - #!mdate -> modification date of the note
*/
import { existsSync, statSync } from "fs";
import { OBA } from "src/oba-base/globals";
import { tools } from "src/tools-base/0-tools-modules";
import { DateTime } from 'luxon';
import { obanotes } from "./0-servises-modules";

export function onload() {
    console.log("Replacer:onload");

    // TODO/ link with Oba.json
    OBA.addCommand({
        id: "oba-replacer-replace all",
        name: "Replacer replace all",
        callback: async () => {
            console.clear()
            // "yyyy:mm:dd-HH:MM:SS"
            const notePath = tools.getCurrNotePath()
            console.log("notePath: ", notePath)
            const noteTFile = tools.getCurrNote()
            console.log("noteTFile: ", noteTFile)

            await OBA.app.vault.process(noteTFile, (data) => {
                return data
                    .replace(/{{mdate}}/g, _fileStatDate(notePath, "mtime", 'yyyy:MM:dd-HH:mm:ss'))
                    .replace(/{{adate}}/g, _fileStatDate(notePath, "atime", 'yyyy:MM:dd-HH:mm:ss'))
                    .replace(/{{cdate}}/g, _fileStatDate(notePath, "ctime", 'yyyy:MM:dd-HH:mm:ss'))
                    .replace(/{{oba.id}}/g, obanotes.genObaNoteId())
            })
        },
    });
}

// import { existsSync, statSync } from "fs";

// TODO/TAI Move out
function _fileStatDate(path: string, statid: "atime" | "mtime" | "ctime", format: string) {
    if (!existsSync(path)) { return null; }
    const stats = statSync(path);
    console.log("stats: ", stats)
    const date = stats?.[statid];
    // TODO: see import { moment } from 'obsidian';
    // moment().format('YYYY-MM-DD')
    return DateTime.fromJSDate(new Date(date)).toFormat(format);    
}
