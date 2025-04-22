export let OBASYNC_FLAG_REG: {[keys: string]: any} = {}

export function getObaSyncFlag(
    key: string, 
    dflt: any = null
) {
    if (key in OBASYNC_FLAG_REG) {
        return OBASYNC_FLAG_REG[key]
    }
    return dflt    
}

export function consumeObaSyncFlag(
    key: string, 
    dflt: any = null
) {
    if (key in OBASYNC_FLAG_REG) {
        const val = OBASYNC_FLAG_REG[key]
        delete OBASYNC_FLAG_REG[key]
        return val
    }
    return dflt
}
export function setObaSyncFlag(
    key: string, 
    value: any, 
    overwrite: boolean = true
) {
    if (key in OBASYNC_FLAG_REG && !overwrite) {
        return
    }
    OBASYNC_FLAG_REG[key] = value
}