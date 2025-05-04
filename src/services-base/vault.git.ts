import { Notice } from 'obsidian';
import simpleGit, { SimpleGit } from 'simple-git';
import { addObaCommand } from 'src/oba-base/commands';
import { getVaultDir } from 'src/tools-base/obsidian-tools';


/*
    TODO/ Move to use gittools
    TODO/ rename to Vault Git
*/ 

/*
    Add a few git utilities
    #TODO:
    - a method which checkout a given note
        - This can be use for making a read only lock
        - If edition is detected, the note is restore to its last git version.
*/
let GIT: SimpleGit;

export function onload() {
    console.log("VaultGit:onload");

    GIT = simpleGit(getVaultDir());

    addObaCommand({
        commandName: "commit default branch",
        serviceName: ["VaultGit"],
        async commandCallback({ commandID, commandFullName }) {
            console.clear()
            await commitVaultGit();
        },
    })
} 

export async function gitCommitCmd() {
    new Notice("TODO/ re-implement vault-git")
    // const isRepo = await isGitRepo();
    // if (!isRepo) {
    //     new Notice('This vault is not a Git repository.');
    //     return;
    // }

    // await commitVaultGit();
}

// TODO/ Move to use gittools
export async function commitVaultGit(): Promise<void> {
    new Notice("TODO/ re-implement vault-git")
    // try {
    //     const vaultRepoConfig = obaconfig.getObaConfig("vault.git.repo", {})
    //     const targetBranch = vaultRepoConfig?.["branchName"]
    //     if (!targetBranch) {
    //         new Notice(`Target branch not setup. See Oba.jsonc "gvault.git.repo"`)
    //         return;
    //     }

    //     const message = buildCmtMsg();
        
    //     const currBranch = await getCurrentBranch()
    //     if (currBranch != targetBranch) {
    //         new Notice(`Target branch != current branch. target: ${targetBranch}, current: ${currBranch}`);
    //         return;
    //     }

    //     const isdirty = await isRepoDirty()
    //     console.log(`isRepoDirty() = ${isdirty}`)
    //     if (isdirty) {
    //         await GIT.add('.');
    //         await GIT.commit(message);
    //         console.log(`Committed changes to branch: ${currBranch}`);
    //     } else {
    //         console.log("Repo is clean")
    //     }
    // } catch (err) {
    //     new Notice(`Failed to commit changes: ${err.message}`);
    //     console.error(err);
    // }
    // return;
}

export function buildCmtMsg() {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    return `Oba Up ${year}-${month}-${day}`;
}