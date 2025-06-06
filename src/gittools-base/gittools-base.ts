import { mkdirSync, writeFileSync } from "fs"
import { rm } from "fs/promises"
import path from "path"
import { _showErrorReport } from "src/tools-base/err-handling"
import { randstring, spawnCommand } from "src/tools-base/utils-tools"

export interface GitRepoOptions {
    repodir: string,
    pullRemoteUrl?: string,
    pushRemoteUrl?: string,
    cloneRemoteUrl?: string,
    branchName?: string,
    extraEnv?: NodeJS.ProcessEnv
}

// MARK: runGitCommand
export async function runGitCommand({
    repoOps,
    args = [],
    timeoutMs = -1,
    rollTimeOut = false,
    logLimit = 100,
}: {
    args: string[]
    repoOps: GitRepoOptions,
    timeoutMs?: number
    rollTimeOut?: boolean
    logLimit?: number
}) {
    // check git repo
    console.log(`\$ git ${args.join(' ')}`)
    let logCount = 0;
    const res = await spawnCommand({
        cmdstr: "git", // force to use system resolved git
        args: args,
        extraEnv: repoOps?.["extraEnv"] || {},
        options: {
            cwd: repoOps["repodir"]
        },
        timeoutMs,
        rollTimeOut,
        onAnyData({ chunck } : {chunck: string}) {
            if (logCount > logLimit) { return; }
            if (logCount == logLimit) {
                console.log("\nLOG LIMIT RACHED...")
            } else { 
                console.log(chunck.replace(/\r/g, '\n'))
            }
            logCount++;
        },
    })
    return res
}

// MARK: isGitDirty
export async function isGitDirty({
    repoOps,
}: {
    repoOps: GitRepoOptions
}) {
    const res = await runGitCommand({
        repoOps,
        args: ['status', '--porcelain']
    })
    if (res?.["code"] != 0 ) { return false; }
    if (res?.["stdout"]?.length > 0) { return true; }
    return false
}

// MARK: isGitValidRepo
export async function isGitValidRepo({
    repoOps
}: {
    repoOps: GitRepoOptions
}) {
    const res = await runGitCommand({
        repoOps,
        args: ['status', '--porcelain']
    })
    return res?.["code"] == 0
}

// MARK: gitCloneHard
export async function gitCloneHard({
    repoOps,
    cloneEnable = false,
    mkRepoDirEnable = false,
    rmRepoEnable = false, 
    timeoutMs = 20 * 1000,
    rollTimeOut = true
}: {
    repoOps: GitRepoOptions,
    cloneEnable?: boolean,
    mkRepoDirEnable?: boolean,
    rmRepoEnable?: boolean,
    timeoutMs?: number,
    rollTimeOut?: boolean
}) {

    const repodir = repoOps["repodir"]

    // MARK: ....reset repodir
    if (rmRepoEnable) await rm(repodir, { recursive: true, force: true })
    if (mkRepoDirEnable) mkdirSync(repodir, { recursive: true })
    
    // MARK: ....clone
    if (!cloneEnable) return true

    const branchName = repoOps?.["branchName"] || 'main'
    const cloneRemoteUrl = repoOps?.["cloneRemoteUrl"] 
    if (!cloneRemoteUrl) {
        _showErrorReport('cloneRemoteUrl missing!', {repoOps})
        return false; // fatal
    }

    // git clone --depth=1 --branch "$branchName" "$cloneRemoteUrl" "$repodir"
    const res = await runGitCommand({
        repoOps,
        args: [
            'clone', 
                '--progress', 
                '--depth=1', 
                "--branch", branchName,
                cloneRemoteUrl, 
                repodir
        ],
        rollTimeOut,
        timeoutMs,
    })

    // check res
    if (res?.["code"] != 0) {
        _showErrorReport('git clone failed', {res, repoOps})
        return false;  // fatal
    }
    return true;
}

// MARK: gitHead
export async function gitHead({
    repoOps
}: {
    repoOps: GitRepoOptions
}) {
    // git symbolic-ref --short HEAD
    const res = await runGitCommand({
        repoOps,
        args: [
            'symbolic-ref', '--short', 'HEAD'
        ]
    })
    // check res
    if (res?.["code"] != 0) {
        _showErrorReport('git symbolic-ref failed', {res, repoOps})
        return '';  // fatal
    }
    return res?.["stdout"]?.[0]?.trim() || ''
}

// MARK: gitHEADBranch
export async function gitHEADBranch({
    repoOps
}: {
    repoOps: GitRepoOptions
}) {
    // git rev-parse --abbrev-ref HEAD
    const res = await runGitCommand({
        repoOps,
        args: [
            'rev-parse', '--abbrev-ref', 'HEAD'
        ]
    })
    // check res
    if (res?.["code"] != 0) {
        _showErrorReport('git rev-parse --abbrev-ref HEAD', {res, repoOps})
        return '';  // fatal
    }
    return res?.["stdout"]?.[0]?.trim() || ''
}

// MARK: touchGitDummy
export function touchGitDummy({
    repoOps,
    txt = randstring()
}: {
    repoOps: GitRepoOptions
    txt: string
}) {
    // TODO/ Add to interface
    const dummyRelPath = (repoOps as any)?.["dummyRelPath"] || [".dummy"]
    const repodir = repoOps?.["repodir"]
    if (!repodir) { return; }
    const dummyFile = path.join(repodir, ...dummyRelPath)
    writeFileSync(dummyFile, txt)
}

// TODO/ Add command
export async function gitCheckInternet({
    repoOps,
    timeoutMs = 20 * 1000
}: {
    repoOps: GitRepoOptions
    timeoutMs?: number
}) {
    // git ls-remote ${remoteUrl}
    const remoteUrl = repoOps["pullRemoteUrl"]
    const res = await runGitCommand({
        repoOps,
        timeoutMs,
        args: [
            'ls-remote', remoteUrl
        ]
    })
    // check res
    if (res?.["code"] != 0) {
        _showErrorReport('git ls-remote ${remoteUrl}', {res, repoOps})
        return false;  // fatal
    }
    return res?.["stdout"].length > 0
}
