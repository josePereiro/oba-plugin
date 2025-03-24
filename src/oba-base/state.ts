/*
    A general container of plugin state data
*/ 

export const STATE: { [key: string]: any } = {};

// read a key in the config file
export function getState(key: string, dflt: any = null) {
    try {
        if (!(key in STATE)) { 
            console.warn(`Unknown key, key: `, key)
            return dflt
        } else {
            return STATE[key]
        }
    } catch (err) {
        console.warn("Error getting config", err);
        return dflt
    }
}

export function setState(key: string, val: any) {
    STATE[key] = val
}