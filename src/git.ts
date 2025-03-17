// DeepSeek
import simpleGit, { SimpleGit, StatusResult } from 'simple-git';
import { Notice } from 'obsidian';
import ObA from './main';

/*
    Add a few git utilities
    #TODO:
    - a method which checkout a given note
        - This can be use for making a read only lock
        - If edition is detected, the note is restore to its last git version.
*/
export class Git {
    private git: SimpleGit;

    constructor(private oba: ObA) {
        console.log("Git:constructor");
        this.git = simpleGit(this.oba.tools.getVaultDir());
    } 

    async isGitRepo(): Promise<boolean> {
        try {
            await this.git.status();
            return true;
        } catch (err) {
            return false;
        }
    }

    async gitCommitCmd() {
        const isRepo = await this.isGitRepo();
        if (!isRepo) {
            new Notice('This vault is not a Git repository.');
            return;
        }

        await this.commitToBranch();
    }

    async commitToBranch(): Promise<void> {
        try {
            const targetBranch = this.oba.configfile.getConfig("git.commit.branch.target")
            if (!targetBranch) {
                new Notice(`Target brach not setup. See Oba.json "git.commit.branch.target"`)
                return;
            }

            const message = this.buildCmtMsg();
            
            const currBranch = await this.getCurrentBranch()
            if (currBranch != targetBranch) {
                new Notice(`Target brach != current brach. target: ${targetBranch}, current: ${currBranch}`);
                return;
            }

            const isdirty = await this.isRepoDirty()
            console.log(`this.isRepoDirty() = ${isdirty}`)
            if (isdirty) {
                await this.git.add('.');
                await this.git.commit(message);
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

    buildCmtMsg() {
        const currentDate = new Date();
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const day = String(currentDate.getDate()).padStart(2, '0');
        return `Oba Up ${year}-${month}-${day}`;
    }

    // Get the current active branch
    async getCurrentBranch(): Promise<string | null> {
        try {
            const branchSummary = await this.git.branch();
            return branchSummary.current; // Returns the name of the current branch
        } catch (err) {
            new Notice(`Failed to get current branch: ${err.message}`);
            console.error(err);
            return null;
        }
    }

    async isRepoDirty(): Promise<boolean> {
        try {
          const status: StatusResult = await this.git.status();
          return !status.isClean(); // Returns `true` if the repo is dirty
        } catch (err) {
          console.error('Error checking repository status:', err);
          throw err;
        }
    }
}