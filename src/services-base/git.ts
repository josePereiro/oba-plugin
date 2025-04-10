import simpleGit, { SimpleGit, StatusResult } from 'simple-git';
import { Notice } from 'obsidian';
import { tools } from 'src/tools-base/0-tools-modules';
import { obaconfig } from 'src/oba-base/0-oba-modules';
import { OBA } from 'src/oba-base/globals';
import { getVaultDir } from 'src/tools-base/obsidian-tools';

/*
    Add a few git utilities
    #TODO:
    - a method which checkout a given note
        - This can be use for making a read only lock
        - If edition is detected, the note is restore to its last git version.
*/
let GIT: SimpleGit;

export function onload() {
    console.log("Git:onload");

    GIT = simpleGit(getVaultDir());

    OBA.addCommand({
        id: 'oba-git-commit-default-branch',
        name: 'Git commit default branch',
        callback: async () => {
            await commitToBranch();
        }
    });
} 

export async function isGitRepo(): Promise<boolean> {
    try {
        await GIT.status();
        return true;
    } catch (err) {
        return false;
    }
}

export async function gitCommitCmd() {
    const isRepo = await isGitRepo();
    if (!isRepo) {
        new Notice('This vault is not a Git repository.');
        return;
    }

    await commitToBranch();
}

export async function commitToBranch(): Promise<void> {
    try {
        const targetBranch = obaconfig.getObaConfig("git.commit.branch.target")
        if (!targetBranch) {
            new Notice(`Target brach not setup. See Oba.json "git.commit.branch.target"`)
            return;
        }

        const message = buildCmtMsg();
        
        const currBranch = await getCurrentBranch()
        if (currBranch != targetBranch) {
            new Notice(`Target brach != current brach. target: ${targetBranch}, current: ${currBranch}`);
            return;
        }

        const isdirty = await isRepoDirty()
        console.log(`isRepoDirty() = ${isdirty}`)
        if (isdirty) {
            await GIT.add('.');
            await GIT.commit(message);
            console.log(`Committed changes to branch: ${currBranch}`);
        } else {
            console.log("Repo is clean")
        }
    } catch (err) {
        new Notice(`Failed to commit changes: ${err.message}`);
        console.error(err);
    }
    return;
}

export function buildCmtMsg() {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    return `Oba Up ${year}-${month}-${day}`;
}

// Get the current active branch
export async function getCurrentBranch(): Promise<string | null> {
    try {
        const branchSummary = await GIT.branch();
        return branchSummary.current; // Returns the name of the current branch
    } catch (err) {
        new Notice(`Failed to get current branch: ${err.message}`);
        console.error(err);
        return null;
    }
}

export async function isRepoDirty(): Promise<boolean> {
    try {
        const status: StatusResult = await GIT.status();
        return !status.isClean(); // Returns `true` if the repo is dirty
    } catch (err) {
        console.error('Error checking repository status:', err);
        throw err;
    }
}