import { addObaCommand } from "src/oba-base/commands";
import { filesys } from "../oba-base/0-oba-modules";
import { jsonIO_tests } from "./jsonio-tests";
import { obaconfig_tests } from "./obaconfig-tests";
import { tools_tests } from "./tools-tests";

export function onload() {
    console.log("Test:onload")
    
    addObaCommand({
        commandName: "run all",
        serviceName: ["Tests"],
        async commandCallback({ commandID, commandFullName }) {
            console.clear()
            console.log("--------")
            console.log("TESTS")
            console.log()
            
            await jsonIO_tests();
            obaconfig_tests();
            tools_tests();
        },
    })
}


export function getObaTestsDir(...name: string[]) {
    return filesys.getObaDir("tests", ...name)
}

