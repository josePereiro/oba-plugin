import { existsSync, mkdirSync } from "fs";
import * as path from "path";

export function mkdirParent(filePath: string): void {
    const parentFolder = path.dirname(filePath);
    if (existsSync(parentFolder)) { return; }
    mkdirSync(parentFolder, { recursive: true });
}