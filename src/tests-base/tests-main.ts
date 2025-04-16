import { checkEnable } from "src/tools-base/oba-tools";
import { filesys } from "../oba-base/0-oba-modules";
import { OBA } from "../oba-base/globals";
import { jsonIO_tests } from "./jsonio-tests";
import { obaconfig_tests } from "./obaconfig-tests";
import { tools_tests } from "./tools-tests";

export function onload() {
    console.log("Test:onload")
    
    OBA.addCommand({
        id: 'oba-tests-run-all',
        name: 'Tests run all',
        callback: async () => {
            checkEnable("tests", {err: true, notice: true})
            console.clear()
            console.log("--------")
            console.log("TESTS")
            console.log()
            
            await jsonIO_tests();
            obaconfig_tests();
            tools_tests();
        }
    });
}


export function getObaTestsDir(...name: string[]) {
    return filesys.getObaDir("tests", ...name)
}

