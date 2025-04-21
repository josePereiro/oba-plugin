import { readdir, rm } from "fs/promises";
import path from "path";
import { TaskState } from "src/tools-base/schedule-tools";
import { execAsync } from "src/tools-base/utils-tools";
import { ObaSyncScheduler } from "./obasync";


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
    // const command = `cd ${repoDir}; echo "${dummyStr}" > ".dummy"; git add .; git commit -m"${cmMsg}";`;
    const command = [
        `echo ">>>>>>>>>>" 2>&1`,
        `echo "_addDummyAndCommit" 2>&1`,
        `cd ${repoDir} 2>&1`, 
        `echo "cd ${repoDir}" 2>&1`,
        `echo "----------" 2>&1`,
        `git remote -v 2>&1`,
        `git status 2>&1`,
        `echo "----------" 2>&1`,
        `echo "touching dummy..." 2>&1`,
        `echo "${dummyStr}" > ".dummy" 2>&1`,
        `git status 2>&1`,
        `echo "----------" 2>&1`,
        `echo "adding..." 2>&1`,
        `git add . 2>&1`,
        `git status 2>&1`,
        `echo "----------" 2>&1`,
        `echo "commiting..." 2>&1`,
        `git commit -m"${cmMsg}" 2>&1`,
        `git status 2>&1`,
        `echo "----------" 2>&1`,
        `echo "done" 2>&1`,
        `echo "<<<<<<<<<<" 2>&1`,
    ].join(";")
    await execAsync(
        command, 
        (stdout: any, stderr: any, error: any) => {
            if (error) { console.error(error) }
            if (stdout) { console.log(stdout) }
        }
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
    let command;
    // TODO: use git service
    // Add git exec config
    // const command = `cd ${repoDir}; git push --all`;
    command = [
        `echo ">>>>>>>>>>" 2>&1`,
        `echo "_justPush" 2>&1`,
        `cd "${repoDir}" 2>&1`, 
        `echo "cd ${repoDir}" 2>&1`,
        `git remote -v 2>&1`,
        `git status 2>&1`,
        `echo "----------" 2>&1`,
        `echo "pushing..." 2>&1`,
    ].join(";")
    await execAsync(
        command, 
        (stdout: any, stderr: any, error: any) => {
            if (error) { console.error(error) }
            if (stdout) { console.log(stdout) }
        }
    )

    command = [
        `cd ${repoDir} 2>&1`, 
        `GIT_HTTP_LOW_SPEED_LIMIT=0`,
        `GIT_HTTP_LOW_SPEED_TIME=${tout}`,
        `git push --all 2>&1`,
        `git status 2>&1`,
        `echo "----------" 2>&1`,
        `echo "done" 2>&1`,
        `echo "<<<<<<<<<<" 2>&1`,
    ].join(";")
    await execAsync(
        command, 
        (stdout: any, stderr: any, error: any) => {
            if (error) { console.error(error) }
            if (stdout) { console.log(stdout) }
        }
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
        resetCommit = 'HEAD~5',
    } = {}
) {

    let command;
    // TODO: use git service
    command = [
        `echo ">>>>>>>>>>" 2>&1`,
        `echo "_fetchCheckoutPull" 2>&1`,
        `cd "${repoDir}" 2>&1`, 
        `echo "cd ${repoDir}" 2>&1`,
        `git remote -v 2>&1`,
        `git status 2>&1`,
        `echo "----------" 2>&1`,
        `echo "fetching..." 2>&1`,
    ].join(";")
    await execAsync(
        command, 
        (stdout: any, stderr: any, error: any) => {
            if (error) { console.error(error) }
            if (stdout) { console.log(stdout) }
        }
    )

    command = [
        `cd ${repoDir}`, 
        `GIT_HTTP_LOW_SPEED_LIMIT=0`,
        `GIT_HTTP_LOW_SPEED_TIME=${tout}`,
        `git fetch --all`,
        `git status 2>&1`,
        `echo "----------" 2>&1`,
        `echo "reseting..." 2>&1`,
        `git reset --hard ${resetCommit} 2>&1`,
        `git status 2>&1`,
        `echo "----------" 2>&1`,
        `echo "cleaning..." 2>&1`,
        `git clean -xdf 2>&1`,
        `git status 2>&1`,
        `echo "----------" 2>&1`,
        `echo "merging..." 2>&1`,
    ].join(";")
    await execAsync(
        command, 
        (stdout: any, stderr: any, error: any) => {
            if (error) { console.error(error) }
            if (stdout) { console.log(stdout) }
        }
    )
    
    command = [
        `cd ${repoDir}`, 
        `GIT_HTTP_LOW_SPEED_LIMIT=0`,
        `GIT_HTTP_LOW_SPEED_TIME=${tout}`,
        `git merge origin 2>&1`,
        `git status 2>&1`,
        `echo "----------" 2>&1`,
        `echo "done" 2>&1`,
        `echo "<<<<<<<<<<" 2>&1`,
    ].join(";")
    await execAsync(
        command, 
        (stdout: any, stderr: any, error: any) => {
            if (error) { console.error(error) }
            if (stdout) { console.log(stdout) }
        }
    )
}

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
    // const command = `cd ${repoDir}; echo "${dummyStr}" > ".dummy"; git add .; git commit -m"${cmMsg}";`;
    const command = [
        `echo ">>>>>>>>>>" 2>&1`,
        `echo "_resetHard" 2>&1`,
        `cd "${repoDir}" 2>&1`, 
        `echo "cd ${repoDir}" 2>&1`,
        `git remote -v 2>&1`,
        `git status 2>&1`,
        `echo "----------" 2>&1`,
        `echo "checking out..." 2>&1`,
        `git clean -xdf 2>&1`,
        `git reset --hard ${resetCommit} 2>&1`,
        `echo "done" 2>&1`,
        `echo "<<<<<<<<<<" 2>&1`,
    ].join(";")
    await execAsync(
        command, 
        (stdout: any, stderr: any, error: any) => {
            if (error) { console.error(error) }
            if (stdout) { console.log(stdout) }
        }
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
        rm(fullPath, { recursive: true, force: true })
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