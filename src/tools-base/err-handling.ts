/**
@file
Provides helper functionality for error handling and validation. This module defines utilities to execute functions while optionally enforcing error checks on their return values. It allows developers to specify custom error messages and failure predicates, enabling more robust control over function execution flows.
 */

export type ExecMode = 
    | 'non.throw.error.silence'
    | 'non.throw.error.log'
    | 'non.throw.error.report'
    | 'throw.error'
    | 'throw.error.and.report'
    | 'throw.error.and.log'

export async function executerAsync<T>({
    fun, 
    execMode,
    dflt = null,
    errMsg = "Error: ",
}: {
    fun: () => any,
    execMode: ExecMode,
    dflt?: T,
    errMsg?: string,
}): Promise<T> {

    if (execMode == 'non.throw.error.silence') {
        try { 
            return await fun() 
        } catch (err) {
            return dflt
        }
    } 
    if (execMode == 'non.throw.error.report') {
        try { 
            return await fun() 
        } catch (err) {
            _showErrorReport(errMsg, {execMode, err}, true)
            return dflt
        }
    } 
    if (execMode == 'non.throw.error.log') {
        try { 
            return await fun() 
        } catch (err) {
            console.error(errMsg, err)
            return dflt
        }
    } 
    if (execMode == 'throw.error.and.report') {
        try { 
            return await fun() 
        } catch (err: unknown) {
            _showErrorReport(errMsg, {execMode, err}, true)
            throw err
        }
    } 
    if (execMode == 'throw.error.and.log') {
        try { 
            return await fun() 
        } catch (err) {
            console.error(errMsg, err)
            throw err
        }
    } 
    if (execMode == 'throw.error') {
        try { 
            return await fun() 
        } catch (err) {
            throw err
        }
    } 

    return null as T
}

// executerAsync<string>({
//     execMode: "non.throw.error.log", 
//     dflt: "bla",
//     fun() {
        
//     },
// })



/*
    DEPRECATE THIS
    - Make most functions to throw error if fatality occurs
    - create an execution helper to introduce flexibility
*/ 

import { Notice } from "obsidian";

export interface ErrVersionCallerOptions {
    strict?: boolean;
    msg?: string;
    fail?: (val: any) => boolean;
}

export function errVersion(
    fun: () => any, 
    {
        strict = false,
        msg = "Error, falsy value",
        fail = (val: any) => !val,
    }: ErrVersionCallerOptions
): any {
    let value = null;
    try {
        value = fun();
        throw new Error("nO-ErRoR");
    } catch (e) {
        if (!strict) { return value; } // ignore all errors
        if (!fail(value)) { return value; } // value is fine
        console.error(e)
        throw new Error(msg); 
    }
}
export function _showErrorReport(
    msg: string,
    objs: { [keys: string]: any}, 
    notice = true
) {
    const reportv: string[] = [`⚠️ ${msg}`]

    for (const key in objs) {
        const obj = objs[key]
        const objstr = JSON.stringify(obj, null, 2).slice(0, 100)
        reportv.push(`- ${key}: ${objstr}`)
    }

    const report = reportv.join("\n")
    if (notice) new Notice(report, 0)
    console.error(report)
}

