import { ChildProcessWithoutNullStreams, exec, spawn, SpawnOptionsWithoutStdio } from "child_process";
import * as _ from 'lodash';
import { promisify } from "util";
import { tools } from "./0-tools-modules";

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

// TODO/ Use a pro hash alg
export function hash64Number(
    input: string, 
    hash0: bigint = 0n
) {
    // Use BigInt for 64-bit precision

    let hash = hash0; 
    for (let i = 0; i < input.length; i++) {
        const charCode = BigInt(input.charCodeAt(i));
        hash = (hash << 5n) - hash + charCode; // Simple hash algorithm
        hash &= 0xFFFFFFFFFFFFFFFFn; // Ensure it stays 64-bit
    }
    return hash
}

export function hash64(
    input: string, 
    hash0: bigint = 0n,  
    base = 16
): string {
    const hash = hash64Number(input, hash0)
    // pad = precision * log_{base} {2}
    // log_{base} {2} = 1 / log_{2} {base}
    let pad = 64 / Math.log2(base)
    pad = Math.ceil(pad)
    return hash.toString(base).padStart(pad, '0');
}

export function hash64Chain(
    val0: string, 
    ...vals: string[]
) {
    let hash = tools.hash64Number(val0, 0n)
    for (const val of vals) {
        hash = tools.hash64Number(val, hash)
    }
    return hash.toString(16).padStart(16, '0');
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

export function _priorityMerge(
    priorities: {[key: string]: number}, ...objects: any[]
) {
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
        if (val) { objs.push(val); }
    }
    return objs
} 


export interface SpawnResult {
    cmdstr: string,
    stdout: string[],
    stderr: string[],
    code?: number,
    spawnErr?: any
    resolvedBy?: 
        "timeout.callback" |
        "cmd.on.error" |
        "catched.error" | 
        "cmd.on.close"
}

export interface SpawnCallbackArgs {
    chunck?: string,
    output_acc?: string[],
    error_acc?: string[], 
    cmd?: ChildProcessWithoutNullStreams
}

// MARK: spawnCommand
export async function spawnCommand({
    cmdstr,
    args = [],
    options,
    extraEnv = {},
    timeoutMs = -1,
    rollTimeOut = false,
    onStdoutData = () => {},
    onStderrData = () => {},
    onAnyData = () => {},
}: {
    cmdstr: string,
    args?: string[], 
    options?: SpawnOptionsWithoutStdio, 
    extraEnv?: NodeJS.ProcessEnv,
    timeoutMs?: number,
    rollTimeOut?: boolean,
    onStdoutData?: (arg: SpawnCallbackArgs) => any,
    onStderrData?: (arg: SpawnCallbackArgs) => any,
    onAnyData?: (arg: SpawnCallbackArgs) => any,
}): Promise<SpawnResult> {

    // merge extra env
    // TODO/ revisit env handling
    const env0 = options?.["env"] || {}
    options["env"] = {...process.env, ...env0, ...extraEnv}

    return new Promise((resolve) => {
        
        let cmd: ChildProcessWithoutNullStreams;
        let output_acc: string[] = [];
        let error_acc: string[] = [];
        let timeout0: NodeJS.Timeout | null = null;
        let timeout1: NodeJS.Timeout | null = null;
        let settled = false;
        let onTimeOut = () => {}

        try {
            cmd = spawn(cmdstr, args, options);

            if (timeoutMs > 0) {
                onTimeOut = () => {
                    cmd.kill('SIGTERM');
                    // force kill after 1s if still alive
                    timeout1 = setTimeout(() => {
                        cmd.kill('SIGKILL')
                        console.log("cmd.kill('SIGKILL');")
                    }, 1000); 
                    console.log("cmd.kill('SIGTERM');")
                    resolve({
                        cmdstr,
                        stdout: output_acc,
                        stderr: error_acc,
                        resolvedBy: "timeout.callback"
                    })
                    settled = true
                }
                // first
                timeout0 = setTimeout(onTimeOut, timeoutMs);
            }

            cmd.stdout.on('data', (data: any) => {
                const chunck = data.toString()
                output_acc.push(chunck)
                onStdoutData({chunck, output_acc, error_acc, cmd})
                onAnyData({chunck, output_acc, error_acc, cmd})
                
                // reset timeout
                if (rollTimeOut && timeout0) {
                    clearTimeout(timeout0);
                    timeout0 = setTimeout(onTimeOut, timeoutMs);
                }
            });
            cmd.stderr.on('data', (data: any) => {
                const chunck = data.toString()
                error_acc.push(chunck)
                onStderrData({chunck, output_acc, error_acc, cmd})
                onAnyData({chunck, output_acc, error_acc, cmd})

                // reset timeout
                if (rollTimeOut && timeout0) {
                    clearTimeout(timeout0);
                    timeout0 = setTimeout(onTimeOut, timeoutMs);
                }
            });

            cmd.on('error', (err: any) => {
                if (timeout0) clearTimeout(timeout0);
                if (timeout1) clearTimeout(timeout1);
                if (settled) return;
                resolve({
                    cmdstr,
                    stdout: output_acc,
                    stderr: error_acc,
                    spawnErr: err,
                    resolvedBy: "cmd.on.error"
                })
                settled = true
            })

            cmd.on('close', (code: number) => {
                if (timeout0) clearTimeout(timeout0);
                if (timeout1) clearTimeout(timeout1);
                if (settled) return;
                resolve({
                    cmdstr,
                    stdout: output_acc,
                    stderr: error_acc,
                    code, 
                    resolvedBy: "cmd.on.close",
                });
                settled = true
            });
        } catch (err) {
            // Catch synchronous errors, e.g., invalid spawn parameters
            if (timeout0) clearTimeout(timeout0);
            if (timeout1) clearTimeout(timeout1);
            
            if (settled) return;
            resolve({
                cmdstr,
                stdout: output_acc,
                stderr: error_acc,
                spawnErr: err,
                resolvedBy: "catched.error"
            })
            settled = true
        } 
    });
}

const _execAsync = promisify(exec);

export async function execAsync(
    commandv: string[],
    callback: ((stdout?: any, stderr?: any, error?: any) => any) = () => null,
    echo = true
) {
    // process commands
    const commandv1: string[] = []
    for (const line of commandv) {
        if(echo) {
            const echo_arg = line.replace(/"/g, "'")
            commandv1.push(`echo "\$ ${echo_arg}"`);
        }
        commandv1.push(line)
    }
    const command = commandv1.join(" 2>&1;\n")

    // exec
    let _stdout, _stderr, _error;
    try {
        const { stdout, stderr } = await _execAsync(command);
        _stdout = stdout
        _stderr = stderr
    } catch (error) {
        _error = error
    } finally {
        await callback(_stdout, _stderr, _error) 
    }
}

// Get and shuffle keys
export function shuffledKeys(obj: any) {
    const keys = Object.keys(obj);
    for (let i = keys.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [keys[i], keys[j]] = [keys[j], keys[i]];
    }
    return keys
}


//  MARK: Parameter Utils
export type FirstParam<T> = 
    T extends (arg: infer P, ...args: any[]) => any 
    ? P 
    : never;

export type UnionParam<T> = 
    T extends (...args: infer P) => any 
    ? P[number] 
    : never;

export type Override<T, U> = Omit<T, keyof U> & U;

// type Type1 = { a: string; b: number };
// type Type2 = { a: number; c: boolean };
// type Type3 = { b: string; d: Date };

// type Combined = OverrideLeft<[Type1, Type2, Type3]>;
// /* Result:
// {
//   a: number;  // From Type2
//   b: string;  // From Type3
//   c: boolean; // From Type2
//   d: Date;    // From Type3
// }
// */
export type OverrideLeft<Types extends any[]> = 
  Types extends [infer First, ...infer Rest]
    ? Override<First, OverrideLeft<Rest>>
    : {};


export function addDefaults<T>(
    base:T,
    defaults: Partial<T>,
){
    for (const key in defaults) {
        base[key] = base?.[key] ?? defaults[key]
    }
}