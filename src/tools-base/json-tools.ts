export {}

// import { existsSync, readFileSync, writeFileSync } from "fs";
// import { readFile, writeFile } from "fs/promises";
// import { mkdirParent } from "./files-tools";

// // TODO: dry this
// export async function loadJSON(path: string) {
//     try {
//         if (!existsSync(path)) {
//             console.error("File missing", path);
//             return null
//         }
//         const data = await readFile(path, 'utf8')
//         const obj = JSON.parse(data); // try parse
//         return obj
//     } catch (err) {
//         console.error("Error loading", err);
//         return null
//     }
// }

// export function loadJSONSync(path: string) {
//     try {
//         if (!existsSync(path)) {
//             console.error("File missing", path);
//             return null
//         }
//         const data = readFileSync(path, 'utf8')
//         const obj = JSON.parse(data); // try parse
//         return obj
//     } catch (err) {
//         console.error("Error loading", err);
//         return null
//     }
// }

// // TODO: dry this
// export async function writeJSON(path: string, obj: any) {
//     try {
//         mkdirParent(path);
//         const jsonString = JSON.stringify(obj, null, 2);
//         await writeFile(path, jsonString, 'utf-8');
//         console.log(`JSON written at: ${path}`);
//     } catch (error) {
//         console.error(`Error writing JSON: ${error}`);
//     }
// }

// export function writeJSOSync(path: string, obj: any) {
//     try {
//         mkdirParent(path);
//         const jsonString = JSON.stringify(obj, null, 2);
//         writeFileSync(path, jsonString, 'utf-8');
//         console.log(`JSON written at: ${path}`);
//     } catch (error) {
//         console.error(`Error writing JSON: ${error}`);
//     }
// }