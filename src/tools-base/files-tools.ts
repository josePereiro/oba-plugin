import { createReadStream, existsSync, mkdirSync } from "fs";
import { readdir, stat } from "fs/promises";
import * as jsyaml from 'js-yaml';
import { Notice } from "obsidian";
import * as path from "path";
import * as readline from 'readline';

export function mkdirParent(filePath: string): void {
    const parentFolder = path.dirname(filePath);
    if (existsSync(parentFolder)) { return; }
    mkdirSync(parentFolder, { recursive: true });
}


export function mkSubDir(
    root: string, 
    ...names: string[]
): string {
    const _dir = path.join(root, ...names);
    if (!existsSync(_dir)) {
        mkdirSync(_dir, { recursive: true });
    }
    return _dir;
}

export function getSubDir(
    root: string, 
    ...names: string[]
): string {
    const _dir = path.join(root, ...names);
    return _dir;
}

export async function readDir(
    directoryPath: string, 
    {
        onpath = () => null,
        onfile = () => null,
        ondir = () => null,
        walkdown = false,
    } : {
        onpath?: (file: string) => any,
        onfile?: (file: string) => any,
        ondir?: (file: string) => any,
        walkdown?: boolean
    }
) {
    // Read all files in directory
    const files = await readdir(directoryPath);

    // Filter and process .md files
    for (const file of files) {
        const fullPath = path.join(directoryPath, file);
        const stats = await stat(fullPath);
        if (onpath(fullPath) === "break") {
            break
        }
        // Skip if it's a directory
        if (stats.isDirectory()) {
            if (ondir(fullPath) === "break") {
                break
            }
            if (walkdown) { 
                await readDir(fullPath, 
                    { onpath, onfile, ondir, walkdown }
                )
            }
        } else if (stats.isFile()) {
            if (onfile(fullPath) === "break") {
                break
            }
        }

    }
}


export async function parseYamlHeaderStream(
    filePath: string,
    lineLim = 100
) {
    // find lines
    const yamlLines: string[] = [] 
    let sepcount = 0
    await readFileLineByLine(
        filePath,
        (line: string, li: number) => {
            if (li > lineLim) {
                return 'break'
            }
            // Skip empty lines and divider lines (---)
                line = line.trim()
                if (line === '---') {
                    sepcount += 1;
                }
                if (sepcount != 1) { return; }
                yamlLines.push(line)
        }
    )

    // parse
    try {
        const yamlText = yamlLines.join('\n')
        return jsyaml.load(yamlText) || null
    } catch (e) {
        new Notice(`Invalid YAML: ${e.message}`);
        return null
    }
}

export function parseYamlHeaderLines(lines: string[]) {
    
    const yamlLines: string[] = [] 
    let sepcount = 0
    for (let line of lines) {
        // Skip empty lines and divider lines (---)
        line = line.trim()
        if (line === '---') {
            sepcount += 1;
        }
        if (sepcount != 1) { continue; }
        yamlLines.push(line)
    }

    try {
        const yamlText = yamlLines.join('\n')
        return jsyaml.load(yamlText) || null
    } catch (e) {
        new Notice(`Invalid YAML: ${e.message}`);
        return null
    }
}

export async function readFileLineByLine(
    filePath: string,
    online: (line: string, li: number) => any
) {
    
    const stream = createReadStream(filePath, { encoding: 'utf8' });
    const rl = readline.createInterface({
      input: stream,
      crlfDelay: Infinity // Recognize all instances of CR LF ('\r\n') as a single line break
    });

    try {
        let li = 1
        for await (const line of rl) {
            if (online(line, li) === 'break') { break; }
            li+=1;
        }
    } finally {
        rl.close(); // Closes the readline interface
        stream.destroy(); // Ensures file descriptor is released
    }
    
}