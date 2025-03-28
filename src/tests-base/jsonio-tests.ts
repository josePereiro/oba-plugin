import { JsonIO, tools } from "src/tools-base/0-tools-modules"
import { getObaTestsDir } from "./tests-main"
import { join } from "path"

// MARK jsonIO
export async function jsonIO_tests() {
    console.log("--------")
    console.log("jsonIO tests")
    console.log()

    testLoadWriteSync()
    await testLoadWriteAsync()
    testJsonIO()
}

function _getTestJsonPath() {
    const testdir = getObaTestsDir()
    const rand = tools.randstring()
    const path = join(testdir, `${rand}.json`)
    return path
}

function testJsonIO() {
    console.log("--------")
    console.log("TEST JsonIO")
    console.log()
    
    const io = new JsonIO()
    const path = _getTestJsonPath()
    let pass = false
    
    console.log("--------")
    const val0 = tools.randstring()
    const obj0 = { "test": tools.randstring() }
    const val1 = io
        .depot(obj0)
        .set("key", val0)
        .get("key")
        .retVal()
    
    console.log('test basic set/get')
    pass = (val0 === val1)
    if (pass) { console.log("Test passed!") } 
    else { console.error("Error val0 !== val1") }

    console.log('test inplace modification')
    const obj1 = io.retDepot()
    pass = (obj0 === obj1)
    if (pass) { console.log("Test passed!") } 
    else { console.error("Error obj0 !== obj1") }

    console.log('test write/load')
    //clear
    const obj2 = io
        .file(path)
        .write()
        .depot({}) 
        .retDepot()
    pass = (obj0 != obj2)
    if (pass) { console.log("Test passed!") } 
    else { console.error("Error obj0 == obj2") }
    // test getd
    const val2 = io
        .getd("key", null)
        .retVal()
    pass = (!val2)
    if (pass) { console.log("Test passed!") } 
    else { console.error("Error val2 != null") }
    // load
    const val3 = io
        .load()
        .get("key")
        .retVal()
    pass = (val0 == val3)
    if (pass) { console.log("Test passed!") } 
    else { console.error("Error val0 != val3") }
    // has
    const val4 = io
        .has("key")
        .retVal()
    pass = (val4 === true)
    if (pass) { console.log("Test passed!") } 
    else { console.error("Error val4 ===false") }

    console.log()

    // console.log("--------")
    // const val2 = io
    //     .depot(obj)
    //     .set("key", val0)
    //     .get("key")
    //     .retVal()
    // console.log()
}

function testLoadWriteSync() {
    console.log("--------")
    console.log("TEST LoadWriteSync")
    console.log()

    console.log("--------")
    const path = _getTestJsonPath()
    const obj0 = { "test": tools.randstring() }
    tools.writeJsonFileSync(path, obj0)
    const obj1 = tools.loadJsonFileSync(path)
    const pass = JSON.stringify(obj0) === JSON.stringify(obj1)
    if (pass) { console.log("Test passed!") } 
    else { console.error("Error obj0 != obj1") }
    console.log()
}

async function testLoadWriteAsync() {
    console.log("--------")
    console.log("TEST LoadWriteAsync")
    console.log()

    console.log("--------")
    const path = _getTestJsonPath()
    const obj0 = { "test": tools.randstring() }
    await tools.writeJsonFileAsync(path, obj0, {strict: true})
    const obj1 = await tools.loadJsonFileAsync(path, {strict: true})
    const eq = JSON.stringify(obj0) === JSON.stringify(obj1)
    if (eq) { console.log("Test passed!") } 
    else { console.error("Error obj0 != obj1") }
    console.log()
}
