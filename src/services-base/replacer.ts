/*
    Add and interface for static replacements
    - for instance 
        - #!mdate -> modification date of the note
*/
import { existsSync, statSync } from "fs";
import { OBA } from "src/oba-base/globals";
import { checkEnable, tools } from "src/tools-base/0-tools-modules";
import { DateTime } from 'luxon';
import { obanotes } from "./0-servises-modules";
import { TFile } from "obsidian";
import { citnotes } from "src/citnotes-base/0-citnotes-modules";
import { getCurrNote, getCurrNotePath, processNoteByLines } from "src/tools-base/obsidian-tools";

export function onload() {
    console.log("Replacer:onload");

    // TODO/ link with Oba.jsonc
    // TODO/ improve this
    OBA.addCommand({
        id: "oba-replacer-replace all",
        name: "Replacer replace all",
        callback: async () => {
            checkEnable("replacer", {err: true, notice: true})
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
    return [
        `#!${src}`, `{{${src}}}`
    ] as string[]
}