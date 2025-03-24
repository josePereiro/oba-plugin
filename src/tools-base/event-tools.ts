/*
    A set of tools to query if some events have happend
*/
import { existsSync, statSync } from "fs";
import { state } from "src/oba-base/0-oba-base";

/*
    compare mtimeMs with a cached one
*/ 
export function compareMtimeMsCached(file: string, eventid = 'glob') {
    
    const ev = {
        "file.exist" : false,
        "file.missing" : false,
        
        "file.new" : false,
        "file.modified": false,
        "file.future": false,
        "file.intact": false,
        "error": 0
    };

    const fileExist = existsSync(file);
    if ( fileExist ) {
        ev["file.exist"] = true
    } else {
        ev["file.missing"] = true
    }

    if (!fileExist) { return ev; } 
    const stats = statSync(file);
    const currMtimeMs = stats.mtimeMs
    const statekey = `event::${eventid}::last.mtimeMs::${file}`
    const lastMtimeMs = state.getState(statekey, -1)
    state.setState(statekey, currMtimeMs)
    if ( lastMtimeMs == -1 ) {
        ev["file.new"] = true
    } else if (lastMtimeMs < currMtimeMs) {
        ev["file.modified"] = true
    } else if (lastMtimeMs > currMtimeMs) { 
        ev["file.future"] = true 
    } else if (lastMtimeMs == currMtimeMs) { 
        ev["file.intact"] = true 
    } else {
        ev["error"] = 1
    }
    return ev;
}

export function compareMtimeMs(file1: string, file2: string) {

    const ev = {
        "files.exist": false,
        "file1.only": false,
        "file2.only": false,
        "files.missing": false,

        "file1.newest": false,
        "file2.newest": false,
        "files.equal": false,

        "file1.newest.equal": false, 
        "file2.newest.equal": false, 

        "error": 0,
    };

    try {
        // check exist
        const file1Exist = existsSync(file1);
        const file2Exist = existsSync(file2);
        if (file1Exist && file2Exist) { 
            ev["files.exist"] = true;
        } else if (file1Exist && !file2Exist) { 
            ev["file1.only"] = true;
        } else if (!file1Exist && file2Exist) { 
            ev["file2.only"] = true;
        } else if (!file1Exist && !file2Exist) { 
            ev["files.missing"] = true;
        } else {
            ev["error"] = 1;
        }
        
        // Get stats for both files
        if (file1Exist && file2Exist) {
            const file1MtimeMs = statSync(file1).mtimeMs;
            const file2MtimeMs = statSync(file2).mtimeMs;
            // Compare modification times
            if (file1MtimeMs > file2MtimeMs) { 
                ev["file1.newest"] = true; 
            } else if (file1MtimeMs < file2MtimeMs) { 
                ev["file2.newest"] = true; 
            } else if (file1MtimeMs == file2MtimeMs) { 
                ev["files.equal"] = true; 
            } else {
                ev["error"] = 2;
            }

            if (file1MtimeMs >= file2MtimeMs) {
                ev["file1.newest.equal"] = true; 
            }
            if (file1MtimeMs <= file2MtimeMs) {
                ev["file2.newest.equal"] = true; 
            }
        }
    } catch (error) {
        ev["error"] = 3;
    }
    return ev
}
