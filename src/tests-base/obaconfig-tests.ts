import { obaconfig } from "src/oba-base/0-oba-modules"

export function obaconfig_tests() {
    console.log("--------")
    console.log("ObaConfig Tests")
    console.log()

    test1()
}

function test1() {
    const val0 = 1234; // need sync with Oba.json
    const val1 = obaconfig.getObaConfig("test.obaconfig.dummy", -1)
    console.log('test basic get')
    const pass = (val0 === val1)
    if (pass) { console.log("Test passed!") } 
    else { console.error("Error val0 !== val1") }
}