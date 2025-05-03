import { existsSync, statSync } from "fs";
import { DateTime } from 'luxon';
import { citnotes } from "src/citnotes-base/0-citnotes-modules";
import { addObaCommand } from "src/oba-base/commands";
import { getCurrNote, getCurrNotePath, processNoteByLines } from "src/tools-base/obsidian-tools";
import { obanotes } from "./0-servises-modules";


/*
    TODO/ Integrate with general template engine
*/


export function onload() {
    console.log("Replacer:onload");

    // TODO/ link better with Oba.jsonc
    // TODO/ improve this
    addObaCommand({
        commandName: "run replacer",
        serviceName: ["Replacer"],
        async commandCallback({ commandID, commandFullName }) {
            console.clear()
            await runReplacer()
        },
    })
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
    const notePath = getCurrNotePath()
    console.log("notePath: ", notePath)
    const noteTFile = getCurrNote()
    console.log("noteTFile: ", noteTFile)

    const replacePairs = [
        [
            "mdate", 
            _fileStatDate(notePath, "mtime", 'yyyy:MM:dd-HH:mm:ss')
        ],
        [
            "mtime", 
            _fileStatDate(notePath, "mtime", 'yyyy:MM:dd-HH:mm:ss')
        ],
        [
            "adate", 
            _fileStatDate(notePath, "atime", 'yyyy:MM:dd-HH:mm:ss')
        ],
        [
            "atime", 
            _fileStatDate(notePath, "atime", 'yyyy:MM:dd-HH:mm:ss')
        ],
        [
            "cdate", 
            _fileStatDate(notePath, "ctime", 'yyyy:MM:dd-HH:mm:ss')
        ],
        [
            "ctime", 
            _fileStatDate(notePath, "ctime", 'yyyy:MM:dd-HH:mm:ss')
        ],
        [
            "gen-oba-id", 
            obanotes.genObaNoteId()
        ],
        [
            "citekey", 
            citnotes.parseCitNoteCiteKey(noteTFile)
        ],
    ]

    await processNoteByLines(
        noteTFile, 
        (line: string) => {
            for (const pair of replacePairs) {
                const val = pair[1]
                for (const regstr of _replacerRegexes(pair[0])) {
                    const reg = new RegExp(regstr, "g")
                    line = line.replace(reg, val)
                }   
            }
            return line
        }
    )
}

function _replacerRegexes(src: string) {
    return [`#!${src}`, `{{${src}}}`]
}