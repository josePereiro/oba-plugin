/*
    Add and interface for static replacements
    - for instance 
        - #!mdate -> modification date of the note
*/
import { existsSync, statSync } from "fs";
import { OBA } from "src/oba-base/globals";
import { tools } from "src/tools-base/0-tools-modules";
import { DateTime } from 'luxon';

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
            const noteTFile = tools.getCurrNote()
            console.log("notePath: ", notePath)

            await OBA.app.vault.process(noteTFile, (data) => {
                return data
                    .replace("#!mdate", _fileStatDate(notePath, "mtime", 'yyyy:MM:dd-HH:mm:ss'))
                    .replace("#!adate", _fileStatDate(notePath, "atime", 'yyyy:MM:dd-HH:mm:ss'))
                    .replace("#!cdate", _fileStatDate(notePath, "ctime", 'yyyy:MM:dd-HH:mm:ss'))
            })
        },
    });
}

// import { existsSync, statSync } from "fs";

// TODO/TAI Move out
function _fileStatDate(path: string, statid: "atime" | "mtime" | "ctime", format: string) {
    if (!existsSync(path)) { return null; }
    const stats = statSync(path);
    const date = stats?.[statid];
    return DateTime.fromJSDate(new Date(date)).toFormat(format);    
}
