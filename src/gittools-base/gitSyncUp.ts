import { existsSync, mkdirSync } from "fs";
import { utcTimeTag } from "src/obasync-base/utils-base";
import { _showErrorReport } from "src/tools-base/err-handling";
import { addDefaults, SpawnResult } from "src/tools-base/utils-tools";
import { gitCloneHard, gitHead, GitRepoOptions, isGitDirty, isGitValidRepo, runGitCommand, touchGitDummy } from "./gittools-base";


function _defaultCommitMsg(preffix: string) {
    return `${preffix} - ${utcTimeTag()}`
}

// MARK: gitSyncDown 

// TODO/ Add a 'fast' internet check command

export type gitSyncUpCallbackReturn = 
    'abort' | void | Promise<'abort' | void>

export async function gitSyncUp(
    gitSyncUpArgs
: {
    repoOps: GitRepoOptions,

    cloneEnable?: boolean,
    rmRepoEnable?: boolean,
    addEnable?: boolean,
    pushEnable?: boolean,
    commitEnable?: boolean,
    commitMsg?: string,
    touchEnable?: boolean,
    mkRepoDirEnable?: boolean,
    cloneForce?: boolean,
    dummyText?: string,
    timeoutMs?: number,
    rollTimeOut?: boolean,
    callback?: () => gitSyncUpCallbackReturn
}) {

    // defaults
    const {
        repoOps,
        cloneEnable = false,
        mkRepoDirEnable = false,
        rmRepoEnable = false,
        addEnable = false,
        commitEnable = false,
        commitMsg = _defaultCommitMsg("gitSyncUp"),
        pushEnable = false,
        touchEnable = false,
        cloneForce = false,
        dummyText = 'Hello Oba',
        timeoutMs = 20 * 1000,
        rollTimeOut = true,
        callback = () => null
    } = gitSyncUpArgs

    let res: SpawnResult;
    
    // MARK: .... check valid
    // ensure dir
    const repodir = repoOps["repodir"]
    if (!existsSync(repodir)) {
        if (mkRepoDirEnable) {
            mkdirSync(repodir, { recursive: true })
        }
    }

    // check git repo
    const isValidGit = await isGitValidRepo({ repoOps })

    // MARK: .... git clone
    // clone is need it
    const doClone = !isValidGit || cloneForce
    if (doClone) {
        
        const flag = await gitCloneHard({
            repoOps,
            cloneEnable,
            mkRepoDirEnable,
            rmRepoEnable,
            timeoutMs,
            rollTimeOut
        })
        if (!flag) { return false; } // fatal
    }

    // MARK: .... check head
    const head = await gitHead({repoOps})
    const branchName = repoOps?.["branchName"] || 'main'
    if (head != branchName) {
        // Add head
        _showErrorReport('head misplaced!', {head, res, repoOps})
        return false; // fatal
    }

    // MARK: .... updates
    const ret = callback()
    if (ret == 'abort') { return false; }

    if (touchEnable) touchGitDummy({repoOps, txt: dummyText})

    // TODO/ extract an addCommit method. 
    // MARK: .... git add
    if (addEnable) {
        // git add .
        const res = await runGitCommand({
            repoOps,
            args: [ 'add', '.' ],
            timeoutMs: 120 * 1000, // TODO: make it an argument
        })
        // check res
        if (res?.["code"] != 0) {
            _showErrorReport('git add failed', {res, repoOps})
        }    
    }

    // MARK: .... git commit
    const doCommit = commitEnable && await isGitDirty({repoOps})
    if (doCommit) {
        // git commit -m "Data update: $(date)"
        const res = await runGitCommand({
            repoOps,
            args: [ 'commit',  '-m', `"${commitMsg}"` ],
            timeoutMs: 120 * 1000, // TODO: make it an argument
        })
        // check res
        while (true) {
            if (res?.["code"] == 0) { break; }
            const ntc_flag = res?.["stdout"]?.join("")?.contains("nothing to commit")
            if (ntc_flag == true) { break; }
            _showErrorReport('git commit failed', {res, repoOps})
        }
    }
    
    // MARK: .... git push
    if (pushEnable) {
        // git push --force origin $branchName
        const res = await runGitCommand({
            repoOps,
            args: ['push', '--force', '--progress', 'origin', branchName],
            timeoutMs,
            rollTimeOut
        })
        // check res
        if (res?.["code"] != 0) {
            _showErrorReport('git push failed', {res, repoOps})
        }
    }

    return true
}