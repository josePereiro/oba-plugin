import { join } from "path";
import { filesys } from "../oba-base/0-oba-modules";
import { OBA } from "../oba-base/globals";
import { tools } from "../tools-base/0-tools-modules";
import { jsonIO_tests } from "./jsonio-tests";

export function onload() {
    console.log("Test:onload")
    
    OBA.addCommand({
        id: 'oba-tests-run-all',
        name: 'Tests run all',
        callback: async () => {
            console.clear()
            console.log("--------")
            console.log("TESTS")
            console.log()
            
            await jsonIO_tests();
        }
    });
}


export function getObaTestsDir(...name: string[]) {
    return filesys.getObaDir("tests", ...name)
}

