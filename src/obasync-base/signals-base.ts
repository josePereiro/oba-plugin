import { GitRepoOptions } from "src/gittools-base/gittools-base"
import { registerObaEventCallback } from "src/scheduler-base/event-callbacks"
import { ObaSchedulerExecutionBlock, ObaSchedulerTask } from "src/scheduler-base/scheduler-base"
import { TaskState } from "src/tools-base/schedule-tools"
import { hash64Chain } from "src/tools-base/utils-tools"
import { ObaSyncManifestIder } from "./manifests-base"
import { ObaSyncEventID } from "./signals-resolve-base"
import { Notice } from "obsidian"

// MARK: ObaSyncSignal
export type HandlingStatus = 
    | "handler.ok" 
    | "unhandled" 
    | "unknown" 
    | "error" 
    | "ignored" 
    | null

export interface ObaSyncSignal {
    "type": string,

    "creator.timestamp"?: string,
    "creator.hashKey"?: string,
    "creator.name"?: string,
    "creator.channelName"?: string,
    
    "committer.name"?: string,
    "committer.timestamp"?: string,
    "committer.channelName"?: string,
    
    "handler.name"?: string
    "handler.callback"?: string
    "handler.timestamp"?: string,
    "handler.handlingStatus"?: HandlingStatus
    "handler.channelName"?: string,
    
    "args"?: {[keys: string]: any} 
}

// MARK: ObaSyncEventCallbackContext
export interface ObaSyncEventCallbackContext {
    "vaultUserName": string,
    "pulledUserName": string,
    "vaultDepot": string,
    "pullRepoOps": GitRepoOptions,
    "pushRepoOps": GitRepoOptions,
    "manIder": ObaSyncManifestIder,
    "pulledSignalKey": string,
    "pulledSignal": ObaSyncSignal | null,
    "eventID"?: string,
    "args"?: {[keys: string]: any} | null
}

// MARK: _signalHashKey
export function _signalHashKey(val0: string, ...vals: string[]) {
    const hash = hash64Chain(val0, ...vals)
    return hash
}

