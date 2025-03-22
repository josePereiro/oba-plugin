import { statSync } from "fs";

export function uriToFilename(url: string): string {
    // Replace invalid characters with underscores
    let filename = url
        .replace(/[/\\:*?"<>|#]/g, '_')   // Replace invalid characters
        .replace(/https?:\/\//, '')       // Remove 'http://' or 'https://'
        .replace(/\./g, '_')              // Replace dots with underscores
        .replace(/\s+/g, '_');            // Replace spaces with underscores

    // Trim the filename to a reasonable length (e.g., 255 characters)
    const maxLength = 255;
    if (filename.length > maxLength) {
        filename = filename.substring(0, maxLength);
    }

    return filename;
}

export function newestMTime(file1: string, file2: string): string {
    try {
        // Get stats for both files
        const stats1 = statSync(file1);
        const stats2 = statSync(file2);

        // Compare modification times
        if (stats1.mtimeMs > stats2.mtimeMs) { return file1; }
        return file2;
    } catch (error) {
        return '-1';
    }
}

export function fixPoint(str0: string, fun) {
    let str1;
    while (true){
        str1 = fun(str0)
        if (str1 == str0) { break; }
        str0 = str1
    }
    return str0
}

export function getFirst(obj0, keys: string[]) {
    let elm = null;
    for (const key of keys) {
        if (elm) { return elm; }
        elm = obj0?.[key]
    }
    return elm;
}

export function _identity(obj) { return obj }

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

export function hash64(input: string): string {
    let hash = 0n; // Use BigInt for 64-bit precision

    for (let i = 0; i < input.length; i++) {
        const charCode = BigInt(input.charCodeAt(i));
        hash = (hash << 5n) - hash + charCode; // Simple hash algorithm
        hash &= 0xFFFFFFFFFFFFFFFFn; // Ensure it stays 64-bit
    }

    return hash.toString(32).padStart(32, '0'); // Convert to 16-character hex string
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

export function randstring(p: string, length: number): string {

    console.log("length ", length)
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
