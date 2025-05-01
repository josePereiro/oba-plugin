import { existsSync, mkdirSync } from "fs"
import { rm } from "fs/promises"
import { Notice } from "obsidian"
import { spawnCommand } from "src/tools-base/utils-tools"

export interface GitRepoOptions {
    repodir: string,
    pullRemoteUrl?: string,
    pushRemoteUrl?: string,
    cloneRemoteUrl?: string,
    branchName?: string
}

// MARK: runGitCommand
export async function runGitCommand({
    repoOps,
    args = [],
    extraEnv = {},
    timeoutMs = -1,
    rollTimeOut = false,
}: {
    args: string[]
    repoOps: GitRepoOptions,
    extraEnv?: NodeJS.ProcessEnv,
    timeoutMs?: number
    rollTimeOut?: boolean
}) {
    // check git repo
    console.log(`\$ git ${args.join(' ')}`)
    const res = await spawnCommand({
        cmdstr: "git", // force to use system resolved git
        args: args,
        extraEnv,
        options: {
            cwd: repoOps["repodir"]
        },
        timeoutMs,
        rollTimeOut,
        onAnyData({ chunck } : {chunck: string}) {
            console.log(chunck)
        },
    })
    return res
}

// MARK: isGitDirty
export async function isGitDirty({
    repoOps,
    extraEnv = {}
}: {
    repoOps: GitRepoOptions,
    extraEnv: NodeJS.ProcessEnv
}) {
    const res = await runGitCommand({
        repoOps,
        args: ['status', '--porcelain'],
        extraEnv
    })
    if (res?.["code"] != 0 ) { return false; }
    if (res?.["stdout"]?.length > 0) { return true; }
    return false
}

// MARK: isGitValidRepo
export async function isGitValidRepo({
    repoOps,
    extraEnv = {}
}: {
    repoOps: GitRepoOptions,
    extraEnv: NodeJS.ProcessEnv
}) {
    const res = await runGitCommand({
        repoOps,
        args: ['status', '--porcelain'],
        extraEnv
    })
    return res?.["code"] == 0
}

// MARK: gitCloneHard
export async function gitCloneHard({
    repoOps,
    cloneEnable = false,
    mkRepoDirEnable = false,
    rmRepoEnable = false,
    extraEnv = {}
}: {
    repoOps: GitRepoOptions,
    cloneEnable?: boolean,
    mkRepoDirEnable?: boolean,
    rmRepoEnable?: boolean,
    extraEnv?: NodeJS.ProcessEnv
}) {

    const repodir = repoOps["repodir"]

    // reset repodir
    if (rmRepoEnable) await rm(repodir, { recursive: true, force: true })
    if (mkRepoDirEnable) mkdirSync(repodir, { recursive: true })
    
    // clone
    if (!cloneEnable) return true

    const branchName = repoOps?.["branchName"] || 'main'
    const cloneRemoteUrl = repoOps?.["cloneRemoteUrl"] 
    if (!cloneRemoteUrl) {
        const msg = [
            'cloneRemoteUrl missing', '\n',
            '- repoOps: ', JSON.stringify(repoOps, null, 2)
        ].join()
        new Notice(msg, 0)
        console.error(msg)
        return false; // fatal
    }

    // git clone --depth=1 --branch "$branchName" "$cloneRemoteUrl" "$repodir"
    const res = await runGitCommand({
        repoOps,
        args: [
            'clone', 
                '--depth=1', 
                "--branch", branchName,
                cloneRemoteUrl, 
                repodir
        ],
        rollTimeOut: true,
        timeoutMs: 40 * 1000, // TODO: make it an argument
        extraEnv
    })

    // check res
    if (res?.["code"] != 0) {
        const msg = [
            'git clone failed', '\n',
            `- repoOps: `, JSON.stringify(repoOps, null, 2), '\n',
            `- res: `, JSON.stringify(res, null, 2)
        ].join()
        new Notice(msg, 0)
        console.error(msg)
        return false;  // fatal
    }
    return true;
}


export async function gitHead({
    repoOps,
    extraEnv = {}
}: {
    repoOps: GitRepoOptions,
    extraEnv: NodeJS.ProcessEnv
}) {
    // git symbolic-ref --short HEAD
    const res = await runGitCommand({
        repoOps,
        args: [
            'symbolic-ref', '--short', 'HEAD'
        ],
        extraEnv
    })
    // check res
    if (res?.["code"] != 0) {
        const msg = [
            'git symbolic-ref failed', '\n',
            `- repoOps: `, JSON.stringify(repoOps, null, 2), '\n',
            `- res: `, JSON.stringify(res, null, 2)
        ].join()
        new Notice(msg, 0)
        console.error(msg)
        return '';  // fatal
    }
    return res?.["stdout"]?.[0]?.trim() || ''
}