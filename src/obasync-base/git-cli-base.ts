import { readdir, rm } from "fs/promises";
import path from "path";
import { TaskState } from "src/tools-base/schedule-tools";
import { execAsync } from "src/tools-base/utils-tools";
import { ObaSyncScheduler } from "./obasync";


/*
    setup new repo

    echo "# Bare-Repo-Template" >> README.md
    git init
    git add README.md
    git commit -m "first commit"
    git branch -M main
    git remote add origin https://github.com/josePereiro/Bare-Repo-Template.git
    git push -u origin main
*/ 

/*
…or push an existing repository from the commandv line
git remote add origin https://github.com/josePereiro/Bare-Repo-Template.git
git branch -M main
git push -u origin main
*/ 

/*
    Sync down

    If repo exists
        i. git fetch --depth=1 --prune
            - fetch and for all remote branches to be the same as remote
            - Apply if online mode is on
        ii. git reset --hard origin/$config.branch
            - reset the local branch to the remote branch
        iii. git clean -xdf
            - remove all untracked files and directories
    If not, or error
        i. git clone --depth=1 $config.url
*/ 

/*
    Sync up
    
    Maybe implement an stage folder with an stage (manType) manifest
    This system will manage the  push actions...
    This way, oba will not forget to the push events
        - This is not required if we force push to remote
    
    If repo exists
        i. git fetch origin $config.branch
        ii. git rebase origin/$config.branch
        # Add or update your new data files here
        iii. git add .
        iv. git commit -m "Data update: $(date)"
        v. git push --force origin $config.branch
    If not, or error
        i. git clone --depth=1 $config.url
*/  




/*
    //TODO/ Force repo name convention
        - push-... and pull-...
        - This avoid a same folder to be used for push and pull
    //TODO/ Think about an stage folder for pushing
*/ 

// MARK: addDummyAndCommit
export async function _addDummyAndCommit(
    repoDir: string,
    cmMsg: string = "obasync.pushed!",
    dummyStr: string = "123"
) {
    // TODO: use git service
    const commandv = [
        `# >>>>>>>>>>`,
        `# _addDummyAndCommit`,
        `cd ${repoDir}`, 
        `# ----------`,
        `git remote -v`,
        `git status`,
        `# ----------`,
        `# touching dummy...`,
        `echo "${dummyStr}" > ".dummy"`,
        `git status`,
        `# ----------`,
        `# adding...`,
        `git add .`,
        `git status`,
        `# ----------`,
        `# commiting...`,
        `git commit -m"${cmMsg}"`,
        `git status`,
        `# ----------`,
        `# done`,
        `# <<<<<<<<<<`,
    ]
    await execAsync(
        commandv, 
        (stdout: any, stderr: any, error: any) => {
            if (error) { console.error(error) }
            if (stdout) { console.log(stdout) }
        },
        true
    )
}

export function _spawnAddDummyAndCommit(
    repoDir: string,
    cmMsg: string = "obasync.pushed!",
    dummyStr: string = "123"
) {
    _spawnToTheEnd(`_addDummyAndCommit:${repoDir}`, async () => {
        await _addDummyAndCommit(repoDir, cmMsg, dummyStr)
    })
}

// MARK: justPush
export async function _justPush(
    repoDir: string,
    {
        tout = 10 // secs
    } = {}
) {
    let commandv;
    // TODO: use git service
    // Add git exec config
    commandv = [
        `# >>>>>>>>>>`,
        `# _justPush`,
        `cd "${repoDir}"`, 
        `git remote -v`,
        `git status`,
        `# ----------`,
        `# pushing...`,
    ]
    await execAsync(
        commandv, 
        (stdout: any, stderr: any, error: any) => {
            if (error) { console.error(error) }
            if (stdout) { console.log(stdout) }
        },
        true
    )

    commandv = [
        `cd ${repoDir}`, 
        `GIT_HTTP_LOW_SPEED_LIMIT=0`,
        `GIT_HTTP_LOW_SPEED_TIME=${tout}`,
        `git push --all`,
        `git status`,
        `# ----------`,
        `# done`,
        `# <<<<<<<<<<`,
    ]
    await execAsync(
        commandv, 
        (stdout: any, stderr: any, error: any) => {
            if (error) { console.error(error) }
            if (stdout) { console.log(stdout) }
        },
        true
    )

}

export function _spawnJustPush(
    repoDir: string, 
    {
        tout = 10, // secs
    } = {}
) {
    _spawnToTheEnd(`_justPush:${repoDir}`, async () => {
        await _justPush(repoDir, { tout })
    })
}

// MARK: _addDummyAndCommitAndPush
export async function _addDummyAndCommitAndPush(
    repoDir: string,
    cmMsg: string = "obasync.pushed!",
    dummyStr: string = "123",
    {
        tout = 10, // secs
    } = {}
) {
    await _addDummyAndCommit(repoDir, cmMsg, dummyStr)
    await _justPush(repoDir, { tout })
}
export function _spawnAddDummyAndCommitAndPush(
    repoDir: string,
    cmMsg: string = "obasync.pushed!",
    dummyStr: string = "123",
    {
        tout = 10, // secs
    } = {}
) {
    _spawnToTheEnd(`_addDummyAndCommitAndPush:${repoDir}`, async () => {
        await _addDummyAndCommitAndPush(repoDir, cmMsg, dummyStr, { tout })
    })
}

// MARK: fetchCheckoutPull
export async function _fetchCheckoutPull(
    repoDir: string, 
    {
        tout = 10, // secs}
        resetCommit = 'HEAD~1',
    } = {}
) {

    let commandv;
    // TODO: use git service
    commandv = [
        `# >>>>>>>>>>`,
        `# _fetchCheckoutPull`,
        `cd "${repoDir}"`, 
        `git remote -v`,
        `git status`,
        `# ----------`,
        `# fetching...`,
    ]
    await execAsync(
        commandv, 
        (stdout: any, stderr: any, error: any) => {
            if (error) { console.error(error) }
            if (stdout) { console.log(stdout) }
        },
        true
    )

    commandv = [
        `cd ${repoDir}`, 
        `GIT_HTTP_LOW_SPEED_LIMIT=0`,
        `GIT_HTTP_LOW_SPEED_TIME=${tout}`,
        `git fetch --all`,
        `git status`,
        `# ----------`,
        `reseting...`,
        `git reset --hard ${resetCommit}`,
        `git status`,
        `# ----------`,
        `# cleaning...`,
        `git clean -xdf`,
        `git status`,
        `# ----------`,
        `# merging...`,
    ]
    await execAsync(
        commandv, 
        (stdout: any, stderr: any, error: any) => {
            if (error) { console.error(error) }
            if (stdout) { console.log(stdout) }
        },
        true
    )
    
    commandv = [
        `cd ${repoDir}`, 
        `GIT_HTTP_LOW_SPEED_LIMIT=0`,
        `GIT_HTTP_LOW_SPEED_TIME=${tout}`,
        `git merge`,
        `git status`,
        `# ----------`,
        `# done`,
        `# <<<<<<<<<<`,
    ]
    await execAsync(
        commandv, 
        (stdout: any, stderr: any, error: any) => {
            if (error) { console.error(error) }
            if (stdout) { console.log(stdout) }
        },
        true
    )
}



    // cd repoDir
    // GIT_HTTP_LOW_SPEED_LIMIT=0
    // GIT_HTTP_LOW_SPEED_TIME=${tout}
    // git fetch --all
    // git reset --hard ${resetCommit}
    // git status
    // git clean -xdf
    // GIT_HTTP_LOW_SPEED_LIMIT=0
    // GIT_HTTP_LOW_SPEED_TIME=${tout}
    // git merge
    // git status


export function _spawnFetchCheckoutPull(
    repoDir: string, 
    {
        tout = 10, // secs
        resetCommit = 'HEAD~5'
    } = {}
) {
    _spawnToTheEnd(`_fetchCheckoutPull:${repoDir}`, async () => {
        await _fetchCheckoutPull(repoDir, { resetCommit, tout })
    })
}

// MARK: _resetHard
export async function _resetHard(
    repoDir: string,
    { resetCommit = 'origin' } = {}
) {
    // TODO: use git service
    const commandv = [
        `# >>>>>>>>>>`,
        `# _resetHard`,
        `cd "${repoDir}"`, 
        `git remote -v`,
        `git status`,
        `# ----------`,
        `# checking out...`,
        `git clean -xdf`,
        `git reset --hard ${resetCommit}`,
        `# done`,
        `# <<<<<<<<<<`,
    ]
    await execAsync(
        commandv, 
        (stdout: any, stderr: any, error: any) => {
            if (error) { console.error(error) }
            if (stdout) { console.log(stdout) }
        },
        true
    )
}

export function _spawnResetHard(
    repoDir: string,
    { resetCommit = 'origin' } = {}
) {
    _spawnToTheEnd(`_resetHard:${repoDir}`, async () => {
        await _resetHard(repoDir, { resetCommit})
    })
}

// MARK: _clearWD
export async function _clearWD(
    repoDir: string,
) {
    const files = await readdir(repoDir);
    for (const file of files) {
        if (file == ".git") { continue; }
        const fullPath = path.join(repoDir, file);
        await rm(fullPath, { recursive: true, force: true })
    }
}

export function _spawnCleatWD(
    repoDir: string,
) {
    _spawnToTheEnd(`_clearWD:${repoDir}`, async () => {
        await _clearWD(repoDir)
    })
}

// MARK: utils
function _spawnToTheEnd(
    id: string, 
    taskFun: (() => any),
    initGas = 100
) {
    ObaSyncScheduler.spawn({
        id: `spawnJustPush:${id}`,
        taskFun: async (task: TaskState) => {
            // clamp down
            if (task["gas"] > initGas) { 
                task["gas"] = initGas
                return; 
            } 
            if (task["gas"] > 0) { return; } // ignore till the end
            await taskFun()
        }, 
        deltaGas: initGas
    })
}