import { existsSync, readFileSync, writeFileSync } from "fs";
import { readFile, writeFile } from "fs/promises";
import * as _ from 'lodash';
import path from "path";
import stripJsonComments from "strip-json-comments";
import { ErrVersionCallerOptions, mkdirParent, tools } from "./0-tools-modules";

// MARK: JsonIO

// DESIGN: Most operations should be "atomic"

export class JsonIO {
    state: {[key: string]: any}

    // TODO/ also store in state an ErrVersionCallerOptions
    //      - to be propagated across all objects

    // TODO/ add lock system

    constructor(state: any = {}) {
        this.state = state;
    }

    // operations
    public file(path: string) {
        this.state["file"] = path;
        return this
    }

    public depot(obj: any) {
        this.state["depot"] = obj
        // console.log('this.state["depot"]: ', this.state["depot"])
        return this
    }

    public load() {
        const depot = loadJsonFileSync(this.state["file"], {strict: true});
        this.state["depot"] = depot
        return this
    }

    public loadd(dflt: any = {}) {
        const depot = loadJsonFileSync(this.state["file"], {strict: false})
        this.state["depot"] = depot || dflt
        return this
    }
    
    public loaddOnDemand(dflt: any = {}) {
        const ramDepot = this.state?.["depot"] || null
        if (ramDepot) { return this; }
        const diskDepot = loadJsonFileSync(this.state["file"], {strict: false})
        this.state["depot"] = diskDepot || dflt
        return this
    }

    public write() {
        writeJsonFileSync(this.state["file"], this.state["depot"])
        return this
    }

    public merge(obj1: any) {
        const obj0 = this.state["depot"]
        _.merge(obj0, obj1);
        return this
    }

    public empty() {
        const obj0 = this.state["depot"]
        for (const key in obj0) {
            if (obj0.hasOwnProperty(key)) {
                delete obj0[key];
            }
        }
        return this
    }

    public withDepot(fun: (obj: any) => void) {
        fun(this.state["depot"])
        return this
    }

    public withState(fun: (obj: any) => void) {
        fun(this.state)
        return this
    }

    public get(key: string) {
        const val = _.get(this.state["depot"], key);
        if (val === undefined) {
            throw new Error(`key '${key}' does not exist!`);
        }
        this.state["val"] = val
        return this
    }

    public getd(key: string, dflt: any = null) {
        this.state["val"] = _.get(this.state["depot"], key, dflt)
        return this
    }

    public getf(key: string, dflt: () => any) {
        this.state["val"] = _.get(this.state["depot"], key, dflt())
        return this
    }

    public set(key: string, val: any) {
        this.state["depot"][key] = val
        // console.log('this.state["depot"][key]: ', this.state["depot"][key])
        return this
    }

    public setf(key: string, val: () => any) {
        this.state["depot"][key] = val()
        return this
    }

    public getset(key: string, val: any) {
        const val0 = this.state?.["depot"]?.[key] || val
        this.state["depot"][key] = val0
        this.state["val"] = val0
        return this
    }

    public getsetf(key: string, val: () => any) {
        const val0 = this.state?.["depot"]?.[key] || val()
        this.state["depot"][key] = val0
        this.state["val"] = val0
        return this
    }

    public has(key: string) {
        this.state["val"] = _.has(this.state["depot"], key)
        return this
    }

    // returns 
    public ret(key: string) {
        return this.state[key]
    }

    public retDepot() {
        return this.state["depot"]
    }

    public retVal() {
        return this.state["val"]
    }

    public retFile() {  
        return this.state["file"]
    }

    // TODO/ make flow control assertion
    //  - Kind of adding a break point
    //  - maybe if it fail jumpto a given 'checkpoint'
    // io.bla().bal().
    //  .testkey("key", "boo")
    //  .bla() // if all ok, ignore otherwise
    //  .checkpoint("bee") // ignored
    //  .bla()
    //  .checkpoint("bee") // retake here
    //  .bla() // always done
    // public ifHasKey(key: string, checkpoint = '') {
    //     const has = _.has(this.state["depot"], key)
    //     this.state["pass"]  = !has
    //     this.state["checkpoint"]  = checkpoint
    //     return this
    // }

    // private _flowcontrol(checkpoint = '') {
    //     if (this.state?.["pass"]) { return false }
    // }

}

// load
function __generalLoadJson(
    path: string, 
    loadfun: any, 
    errops: ErrVersionCallerOptions = {}
) {
    const fun = () => {
        if (!existsSync(path)) {
            console.error("File missing", path);
            return null
        }
        const ret = loadfun();
        if (ret instanceof Promise) {
            return ret.then((ret1) => {
                // console.log(`JSON loaded from: ${path}`);
                return ret1;
                })
        } else {
            // console.log(`JSON loaded from: ${path}`);
            return ret;
        }
    }
    return tools.errVersion(fun, errops)
}

export function loadJsonFileSync(
    filePath: string, 
    errops: ErrVersionCallerOptions = {}
) {
    const fun = () => { 
        const ext = path.extname(filePath)
        let data = readFileSync(filePath, 'utf8') 
        if (ext == '.jsonc') { data = stripJsonComments(data); }
        const obj = JSON.parse(data); // try parse
        return obj
    }
    return __generalLoadJson(filePath, fun, errops)
}

export async function loadJsonFileAsync(
    path: string, 
    errops: ErrVersionCallerOptions = {}
) {
    const fun = async () => { 
        const data = await readFile(path, 'utf8') 
        const obj = JSON.parse(data); // try parse
        return obj
    }
    return await __generalLoadJson(path, fun, errops)
}

// write
function __generalWriteJson(
    path: string, 
    obj: any,
    writefun: any, 
    errops: ErrVersionCallerOptions = {
        msg: "Write failed"
    }
) {
    const fun = () => {
        mkdirParent(path);
        const jsonString = JSON.stringify(obj, null, 2);
        const ret = writefun(jsonString)
        if (ret instanceof Promise) {
            return ret.then((ret1) => {
                console.log(`JSON written at: ${path}`);
                return ret1;
            })
        } else {
            console.log(`JSON written at: ${path}`);
            return ret;
        }
    }
    return tools.errVersion(fun, errops);
}

export async function writeJsonFileAsync(
    path: string, 
    obj: any,
    errops: ErrVersionCallerOptions = {}
) {
    const fun = async (txt: string) => { 
        await writeFile(path, txt, 'utf-8') 
        return true
    }
    return await __generalWriteJson(path, obj, fun, errops)
}

export function writeJsonFileSync(
    path: string, 
    obj: any,
    errops: ErrVersionCallerOptions = {}
) {
    const fun = (txt: string) => { 
        writeFileSync(path, txt, 'utf-8')
        return true 
    }
    return __generalWriteJson(path, obj, fun, errops)
}
