import { Notice } from 'obsidian';
import { gitSyncUp } from 'src/gittools-base/gitSyncUp';
import { gitHEADBranch, GitRepoOptions, isGitDirty, isGitValidRepo } from 'src/gittools-base/gittools-base';
import { addObaCommand } from 'src/oba-base/commands';
import { getObaConfig } from 'src/oba-base/obaconfig';
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

export function onload() {
    console.log("VaultGit:onload");

    addObaCommand({
        commandName: "commit default branch",
        serviceName: ["VaultGit"],
        async commandCallback({ commandID, commandFullName }) {
            console.clear()
            const vaultGitOps: GitRepoOptions = getVaultGitConfig()
            if (!vaultGitOps) {
                new Notice(`Vault git not setup. See Oba.jsonc "vault.git.repo" documentation`)
                return;
            }        
            await commitGiVault({vaultGitOps});
        },
    })
} 


export function getVaultGitConfig() {
    const vaultRepoConfig: GitRepoOptions = getObaConfig("vault.git.repo", null)
    if (!vaultRepoConfig) { return null; }
    vaultRepoConfig["repodir"] = getVaultDir()
    return vaultRepoConfig
}

// TODO/ Move to use gittools
export async function commitGiVault({
    vaultGitOps,
}: {
    vaultGitOps: GitRepoOptions,
}) {

    const isValid = isGitValidRepo({repoOps: vaultGitOps})
    if (!isValid) {
        new Notice(`Vault is not a valid git repo. You must manually 'git init' it.`)
        return;
    }

    const targetBranch = vaultGitOps?.["branchName"]
    if (!targetBranch) {
        new Notice(`Target branch not setup. See Oba.jsonc "vault.git.repo" documentation`)
        return;
    }
    
    const currBranch = await gitHEADBranch({repoOps: vaultGitOps})
    if (currBranch != targetBranch) {
        new Notice(`Target branch != current branch. target: ${targetBranch}, current: ${currBranch}`);
        return;
    }

    const isdirty = await isGitDirty({repoOps: vaultGitOps})
    console.log(`isRepoDirty() = ${isdirty}`)
    if (isdirty) {
        await gitSyncUp({
            repoOps: vaultGitOps,
            cloneEnable: false,
            mkRepoDirEnable: false,
            rmRepoEnable: false,
            addEnable: true,
            commitEnable: true,
            commitMsg: buildCmtMsg(),
            pushEnable: false,
            touchEnable: false,
            cloneForce: false
        })
        console.log(`Committed changes to branch: ${currBranch}`);
        new Notice('Vault repo committed')
    } else {
        console.log("Repo is clean")
        new Notice('Vault repo clean')
    }
}

function buildCmtMsg() {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    return `Oba Up ${year}-${month}-${day}`;
}