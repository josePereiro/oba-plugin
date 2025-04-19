/*
    Handle console logging so it is actually useful
*/ 

export function _log(tag: string, dat0: any, ...dats: string[]) {
    console.log(tag, dat0, ...dats)
}

export function _warn(tag: string, dat0: any, ...dats: string[]) {
    console.warn(tag, dat0, ...dats)
}

export function _error(tag: string, dat0: any, ...dats: string[]) {
    console.error(tag, dat0, ...dats)
}