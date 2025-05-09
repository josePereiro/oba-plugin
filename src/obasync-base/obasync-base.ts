import { getObaConfig } from "src/oba-base/obaconfig"

export interface ObaSyncRepoConfig {
    "repodir": string,
    "branchName": string,
    "cloneRemoteUrl": string,
    "pullRemoteUrl": string,
    "pushRemoteUrl": string,
    "pingFile": string,
    "extraEnv"?: NodeJS.ProcessEnv
}

export interface ObaSyncOneChannelConfig {
    "push.depot": ObaSyncRepoConfig,
    "pull.depots": ObaSyncRepoConfig[],
    "include.content.regexs"?: string[]
    "include.path.regexs"?: string[]
}

export interface ObaSyncAllChannelsConfig {
    [keys: string]: ObaSyncOneChannelConfig
}

export function getObaSyncAllChannelsConfig(dflt: any = null) {
    return getObaConfig("obasync.channels", dflt) as ObaSyncAllChannelsConfig
}



// TODO? DEPRECATE. Use oba.state, or oba.flags if you want.
// export let OBASYNC_FLAG_REG: {[keys: string]: any} = {}

// export function getObaSyncFlag(
//     key: string, 
//     dflt: any = null
// ) {
//     if (key in OBASYNC_FLAG_REG) {
//         return OBASYNC_FLAG_REG[key]
//     }
//     return dflt    
// }

// export function consumeObaSyncFlag(
//     key: string, 
//     dflt: any = null
// ) {
//     if (key in OBASYNC_FLAG_REG) {
//         const val = OBASYNC_FLAG_REG[key]
//         delete OBASYNC_FLAG_REG[key]
//         return val
//     }
//     return dflt
// }

// export function setObaSyncFlag(
//     key: string, 
//     value: any, 
//     overwrite: boolean = true
// ) {
//     if (key in OBASYNC_FLAG_REG && !overwrite) {
//         return
//     }
//     OBASYNC_FLAG_REG[key] = value
// }