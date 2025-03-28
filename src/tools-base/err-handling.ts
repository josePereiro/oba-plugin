/**
@file
Provides helper functionality for error handling and validation. This module defines utilities to execute functions while optionally enforcing error checks on their return values. It allows developers to specify custom error messages and failure predicates, enabling more robust control over function execution flows.
 */

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

