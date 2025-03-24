/*
    Allow parsing markdown sections as key/value 
    - Parse scope
        - for instance a section or a number of join lines
*/

import { readFileSync } from "fs";
import { OBA } from "src/oba-base/globals";
import { tools } from "src/tools-base/0-tools-modules";

export function onload() {
    console.log("MdJSON:onload");

    OBA.addCommand({
        id: "oba-mdjson-parse-current-note",
        name: "MdJSON parse current note",
        callback: () => {
            console.clear()
            const path = tools.getCurrNotePath()
            const text = readFileSync(path, 'utf8')
            const mdjson = parseKVOnelines(text);
            console.log("mdjson")
            console.log(mdjson)
        },
    });
}

// MARK: parseKVOnelines
function _formatKey(key0: string) {
    return tools.fixPoint(key0, keyi => {
        return keyi.trim().
            replace(/^-/, '').
            replace(/-$/, '').
            replace(/^\*/, '').
            replace(/\*$/, '').
            replace(/^_/, '').
            replace(/^_/, '').
            replace(/_$/, '').
            replace(/>_/, '')
    })
}

function _formatValue(value: string) {
    return value.trim()
}

function _parseKVOneline(line: string, kvs) {
    // Remove >
            
    // Split the line into key and value based on the first occurrence of '**'
    const splitIndex = line.indexOf(':');
    if (splitIndex !== -1) {
        const key = _formatKey(
            line.substring(0, splitIndex)
        );
        if (!key) { return false; }
        const value = _formatValue(
            line.substring(splitIndex + 1)
        );
        if (!value) { return false; }
        kvs[key] = value;
    }
    return true;
}

export function parseKVOnelines(text: string, filter = (line) => true) {
    const lines = text.split('\n'); // Split the text into lines
    const kv = {};

    lines.forEach(line => {
        if (!filter(line)) { return; } 
        _parseKVOneline(line, kv)
    });

    return kv;
}