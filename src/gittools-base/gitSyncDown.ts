import { existsSync, mkdirSync } from "fs";
import { Notice } from "obsidian";
import { SpawnResult } from "src/tools-base/utils-tools";
import { gitCloneHard, GitRepoOptions, isGitValidRepo, runGitCommand } from "./gittools-base";


// MARK: gitSyncDown >>>>>>>>>>>>>
export async function gitSyncDown({
    repoOps,
    fetchEnable = false,
    cloneEnable = false,
    mkRepoDirEnable = false,
    resetEnable = false,
    gcEnable = false,
    cleanEnable = false,
    rmRepoEnable = false,
    cloneForce = false
}: {
    repoOps: GitRepoOptions
    fetchEnable?: boolean,
    cloneEnable?: boolean,
    rmRepoEnable?: boolean,
    mkRepoDirEnable?: boolean,
    resetEnable?: boolean,
    gcEnable?: boolean,
    cleanEnable?: boolean,
    cloneForce?: boolean,
}) {

    let res: SpawnResult;

    // MARK: .... check valid
    // ensure dir
    const repodir = repoOps["repodir"]
    if (!existsSync(repodir)) {
        if (mkRepoDirEnable) mkdirSync(repodir, { recursive: true })
    }

    // check git repo
    const extraEnv = repoOps?.["extraEnv"]  || {}
    const isValidGit = await isGitValidRepo({ repoOps })

    // MARK: .... git clone
    // clone is need it
    const doClone = !isValidGit || cloneForce
    while (doClone) {
        const flag = await gitCloneHard({
            repoOps,
            cloneEnable,
            mkRepoDirEnable,
            rmRepoEnable
        })
        if (!flag) { return false; } // fatal
    }

    // MARK: .... git fetch
    if (fetchEnable) {
        const branchName = repoOps?.["branchName"] || 'main'
        // git fetch origin $branchName --prune --depth=1 
        const res = await runGitCommand({
            repoOps,
            args: [ 'fetch', 'origin', branchName, '--prune', '--depth=1' ],
            rollTimeOut: true,
            timeoutMs: 10 * 1000, // TODO: make it an argument
        })
        // check res
        if (res?.["code"] != 0) {
            const msg = [
                'git fetch failed', '\n',
                `- repoOps: `, JSON.stringify(repoOps, null, 2), '\n',
                `- res: `, JSON.stringify(res, null, 2)
            ].join()
            new Notice(msg, 0)
            console.error(msg)
        }
    }

    // MARK: .... git reset
    if (resetEnable) {
        const branchName = repoOps?.["branchName"] || 'main'
        // git reset --hard origin/$branchName
        const res = await runGitCommand({
            repoOps,
            args: [ 'reset', '--hard', `origin/${branchName}` ],
            timeoutMs: 120 * 1000, // TODO: make it an argument
        })
        // check res
        if (res?.["code"] != 0) {
            const msg = [
                'git reset failed', '\n',
                `- repoOps: `, JSON.stringify(repoOps, null, 2), '\n',
                `- res: `, JSON.stringify(res, null, 2)
            ].join()
            new Notice(msg, 0)
            console.error(msg)
        }
    }

    // MARK: .... git gc
    if (gcEnable) {
        // git gc --prune
        const res = await runGitCommand({
            repoOps,
            args: [ 'gc', '--prune' ],
            timeoutMs: 120 * 1000, // TODO: make it an argument
        })
        // check res
        if (res?.["code"] != 0) {
            const msg = [
                'git gc failed', '\n',
                `- repoOps: `, JSON.stringify(repoOps, null, 2), '\n',
                `- res: `, JSON.stringify(res, null, 2)
            ].join()
            new Notice(msg, 0)
            console.error(msg)
        }
    }

     // MARK: .... git clean
     if (cleanEnable) {
        // git clean -fdx
        const res = await runGitCommand({
            repoOps,
            args: ['clean', "-fdx"],
            timeoutMs: 120 * 1000, // TODO: make it an argument
        })
        // check res
        if (res?.["code"] != 0) {
            const msg = [
                'git clean failed', '\n',
                `- repoOps: `, JSON.stringify(repoOps, null, 2), '\n',
                `- res: `, JSON.stringify(res, null, 2)
            ].join()
            new Notice(msg, 0)
            console.error(msg)
        }
    }
    return true
}