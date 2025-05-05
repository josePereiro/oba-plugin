import path from "path";
import { randstring, SpawnResult } from "src/tools-base/utils-tools";
import { gitCloneHard, gitHead, GitRepoOptions, isGitDirty, isGitValidRepo, runGitCommand, touchGitDummy } from "./gittools-base";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { Notice } from "obsidian";
import { utcTimeTag } from "src/obasync-base/utils-base";


function _defaultCommitMsg(preffix: string) {
    return `${gitSyncUp} - ${utcTimeTag()}`
}

// MARK: gitSyncDown 
export async function gitSyncUp({
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
    callback = () => null
}: {
    repoOps: GitRepoOptions
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
    callback?: () => any
}) {

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
        })
        if (!flag) { return false; } // fatal
    }

    // MARK: .... check head
    const head = await gitHead({repoOps})
    const branchName = repoOps?.["branchName"] || 'main'
    if (head != branchName) {
        const msg = [
            'head misplaced!', '\n',
            `- head: `, head, '\n',
            `- repoOps: `, JSON.stringify(repoOps, null, 2), '\n',
            `- res: `, JSON.stringify(res, null, 2)
        ].join()
        new Notice(msg, 0)
        console.error(msg)
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
            const msg = [
                'git add failed', '\n',
                `- repoOps: `, JSON.stringify(repoOps, null, 2), '\n',
                `- res: `, JSON.stringify(res, null, 2)
            ].join()
            new Notice(msg, 0)
            console.error(msg)
        }    
    }

    // MARK: .... git commit
    const doCommit = commitEnable && await isGitDirty({repoOps})
    if (doCommit) {
        // git commit -m "Data update: $(date)"
        const res = await runGitCommand({
            repoOps,
            args: [ 'commit', '-m', `"${commitMsg}"` ],
            timeoutMs: 120 * 1000, // TODO: make it an argument
        })
        // check res
        if (res?.["code"] != 0) {
            const msg = [
                'git commit failed', '\n',
                `- repoOps: `, JSON.stringify(repoOps, null, 2), '\n',
                `- res: `, JSON.stringify(res, null, 2)
            ].join()
            new Notice(msg, 0)
            console.error(msg)
        }
    }
    
    // MARK: .... git push
    if (pushEnable) {
        // git push --force origin $branchName
        const res = await runGitCommand({
            repoOps,
            args: ['push', '--force', 'origin', branchName],
            timeoutMs: 120 * 1000, // TODO: make it an argument
        })
        // check res
        if (res?.["code"] != 0) {
            const msg = [
                'git push failed', '\n',
                `- repoOps: `, JSON.stringify(repoOps, null, 2), '\n',
                `- res: `, JSON.stringify(res, null, 2)
            ].join()
            new Notice(msg, 0)
            console.error(msg)
        }
    }

    return true
}