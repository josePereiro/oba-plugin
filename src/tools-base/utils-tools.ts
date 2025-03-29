import { tools } from "./0-tools-modules";
import * as _ from 'lodash'

export function uriToFilename(url: string): string {
    // 
    let filename = tools.fixPoint(url, (texti: string) => {
        return texti.trim().replace(/[^0-9a-zA-Z]/g, '_')
    })
    // Trim the filename to a reasonable length (e.g., 255 characters)
    const maxLength = 255;
    if (filename.length > maxLength) {
        filename = filename.substring(0, maxLength);
    }

    return filename;
}

export function fixPoint(str0: string, fun: any) {
    let str1;
    while (true){
        str1 = fun(str0)
        if (str1 == str0) { break; }
        str0 = str1
    }
    return str0
}

export function getFirst(obj0: any, keys: string[]) {
    let elm = null;
    for (const key of keys) {
        if (elm) { return elm; }
        elm = obj0?.[key]
    }
    return elm;
}

export function _identity(obj: any) { return obj }

export function findStr(
    {   
        str0 = null,
        key = null,
        objList = null,
        foundFun = _identity,
        getEntry = _identity 
    } : {
        str0?: string | null;
        key?: string | null;
        objList?: any[] | null;
        foundFun?: (str0: string, str1: string) => boolean;
        getEntry?: (entry: any) => any;
    } = {}
){
    if (!str0) { return null; } 
    if (!key) { return null; } 
    if (!objList) { return null; }
    for (const entry0 of objList) {
        const entry = getEntry(entry0);
        const str1 = entry?.[key]
        if (typeof str1 !== "string") { continue; }
        const ret = foundFun(str0, str1);
        if (ret) { return entry0 }
    }
    return null
}


export function hasPrefix(str0: string, str1: string) {
    if (!str1) { return false; }
    if (str0.startsWith(str1)) { return true; }
    if (str1.startsWith(str0)) { return true; }
    return false
}

// TODO: rename?
export function hasSuffix(str0: string, str1: string) {
    if (!str1) { return false; }
    if (str0.endsWith(str1)) { return true; }
    if (str1.endsWith(str0)) { return true; }
    return false
}

export function absDoi(doi: string): string {
    if (!doi) { return '' }
    if (!doi.startsWith('https://doi.org/')) {
        return 'https://doi.org/' + doi;
    }
    return doi
}

export function hash64(input: string, base = 16): string {
    let hash = 0n; // Use BigInt for 64-bit precision

    for (let i = 0; i < input.length; i++) {
        const charCode = BigInt(input.charCodeAt(i));
        hash = (hash << 5n) - hash + charCode; // Simple hash algorithm
        hash &= 0xFFFFFFFFFFFFFFFFn; // Ensure it stays 64-bit
    }

    // pad = precision * log_{base} {2}
    // log_{base} {2} = 1 / log_{2} {base}
    let pad = 64 / Math.log2(base)
    pad = Math.ceil(pad)
    return hash.toString(base).padStart(pad, '0');
}

export function toCamelCase(sentence: string): string {
    // Split the sentence into words based on spaces
    const words = sentence.split(/[\s\-_]/);

    // Process each word
    const camelCased = words.map((word, index) => {
        if (index === 0) {
            // Keep the first word in lowercase
            return word.toLowerCase();
        } else {
            // Capitalize the first letter of subsequent words and lowercase the rest
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        }
    });

    // Join the words together without spaces
    return camelCased.join('');
}

export function randstring(p = '', length = 8): string {

    const CHARACTERS  = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    if (length < 1) { length = 1; }
    let rand = '';
    const charactersLength = CHARACTERS.length;
    for ( let i = 0; i < length; i++ ) {
        const rinx = Math.floor(Math.random() * charactersLength)
        rand += CHARACTERS.charAt(rinx);
    }
    return `${p}${rand}`
}

export function _unionKeys(...objects: any[]) {
    return _.union(...objects.map((obj) => Object.keys(obj)))
}

function __priorityMerge(
    priorities: {[key: string]: number}, 
    target = 0,
    obj0: any, 
    obj1: any
) {
    const keys = _unionKeys(obj0, obj1)
    console.log("keys: ", keys)
    for (const key of keys) {
        console.log(key)
        const val0 = obj0?.[key]
        const val1 = obj1?.[key]

        // check undefined
        if (val0 === undefined) {
            obj0[key] = val1
            continue
        } 
        if (val1 === undefined) {
            continue
        }
        if (val0 === undefined && val1 === undefined) {
            continue
        }

        // check priority
        const priority = priorities?.[key]
        if (!priority) { continue }
        if (priority == target) {
            obj0[key] = val1
            continue
        }
    }
}

export function _priorityMerge(priorities: {[key: string]: number}, ...objects: any[]) {
    let obj0 = null;
    let target = -1
    for (const obji of objects) {
        target++;
        if (!obj0) {
            obj0 = obji;
            continue
        }
        __priorityMerge(priorities, target, obj0, obji)
    }
    return obj0
}

export function _mergeAll(...objects: any[]) {
    return _priorityMerge({}, ...objects)
}
export function _extractFirst(key: string, ...sources: any[]) {
    for (const obj of sources) {
        const val = obj?.[key];
        if (val) { return val; }
    }
    return null
} 

export function _extractField(key: string, ...sources: any[]) {
    const objs: any[] = []
    for (const obj of sources) {
        const val = obj?.[key];
        if (val) { objs.push(obj); }
    }
    return objs
} 