import { existsSync, mkdirSync } from "fs";
import { _showErrorReport } from "src/tools-base/err-handling";
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
    timeoutMs = 20 * 1000,
    rollTimeOut = true,
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
    timeoutMs?: number,
    rollTimeOut?: boolean,
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
            args: [ 
                'fetch', 'origin', branchName, 
                    '--prune', '--depth=1', 
                    '--progress'
            ],
            rollTimeOut,
            timeoutMs
        })
        // check res
        if (res?.["code"] != 0) {
            _showErrorReport('git fetch failed', {res, repoOps})
        }
    }

    // MARK: .... git reset
    if (resetEnable) {
        const branchName = repoOps?.["branchName"] || 'main'
        // git reset --hard origin/$branchName
        const res = await runGitCommand({
            repoOps,
            args: [ 'reset', '--hard', `origin/${branchName}` ],
            rollTimeOut,
            timeoutMs
        })
        // check res
        if (res?.["code"] != 0) {
            _showErrorReport('git reset failed', {res, repoOps})
        }
    }

    // MARK: .... git gc
    if (gcEnable) {
        // git gc --prune
        const res = await runGitCommand({
            repoOps,
            args: [ 'gc', '--prune' ],
            rollTimeOut,
            timeoutMs
        })
        // check res
        if (res?.["code"] != 0) {
            _showErrorReport('git gc failed', {res, repoOps})
        }
    }

     // MARK: .... git clean
     if (cleanEnable) {
        // git clean -fdx
        const res = await runGitCommand({
            repoOps,
            args: ['clean', "-fdx"],
            rollTimeOut,
            timeoutMs
        })
        // check res
        if (res?.["code"] != 0) {
            _showErrorReport('git clean failed', {res, repoOps})
        }
    }
    return true
}