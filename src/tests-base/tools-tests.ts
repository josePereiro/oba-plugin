import { _priorityMerge, _unionKeys } from "src/tools-base/utils-tools"
import * as _ from 'lodash'

export function tools_tests() {
    console.log("--------")
    console.log("Tools Tests")
    console.log()

    _test1()
}

function _test1() {
    console.log("--------")
    console.log("Test priorityMerge")
    console.log()

    const obj1 = {"A": 1, "B": 2}
    console.log(obj1)
    const obj2 = {"C": 1, "B": 3}
    console.log(obj2)
    const obj3 = {"A": 2, "B": 4}
    console.log(obj3)
    let pass;
    const U = _unionKeys(obj1, obj2, obj3)
    console.log(U)
    pass = (U.length == 3)
    console.log(pass)
    const M = _priorityMerge({"B": 1, "A": 2}, obj1, obj2, obj3)
    console.log(M)
    pass = _.isEqual(M, {"A": 2, "B": 3, "C": 1})
    console.log(pass)
}