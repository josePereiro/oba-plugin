import { exec } from "child_process";
import { readdir, rm } from "fs/promises";
import path from "path";
import { execAsync, randstring } from "src/tools-base/utils-tools";


export async function _addDummyAndCommit(
    repoDir: string,
    cmMsg: string = "obasync.pushed!",
    dummyStr: string = "123"
) {
    // TODO: use git service
    // const command = `cd ${repoDir}; echo "${dummyStr}" > ".dummy"; git add .; git commit -m"${cmMsg}";`;
    const command = [
        `echo ">>>>>>>>>>" 2>&1`,
        `echo "cd..." 2>&1`,
        `cd ${repoDir} 2>&1`, 
        `echo "touching dummy..." 2>&1`,
        `echo "${dummyStr}" > ".dummy" 2>&1`,
        `echo "adding..." 2>&1`,
        `git add . 2>&1`,
        `echo "commiting..." 2>&1`,
        `git commit -m"${cmMsg}" 2>&1`,
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

export async function _justPush(
    repoDir: string,
    tout = 10 // secs
) {
    let command;
    // TODO: use git service
    // Add git exec config
    // const command = `cd ${repoDir}; git push --all`;
    command = [
        `echo ">>>>>>>>>>" 2>&1`,
        `echo "cd..." 2>&1`,
        `cd "${repoDir}" 2>&1`, 
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
        `cd ${repoDir}`, 
        `GIT_HTTP_LOW_SPEED_LIMIT=0`,
        `GIT_HTTP_LOW_SPEED_TIME=${tout}`,
        `git push --all 2>&1`,
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

export async function _fetchCheckoutPull(
    repoDir: string, 
    tout = 10 // secs
) {

    let command;
    // TODO: use git service
    // const command = `cd ${repoDir}; git fetch --all; git pull`;
    command = [
        `echo ">>>>>>>>>>" 2>&1`,
        `echo "cd..." 2>&1`,
        `cd ${repoDir}`, 
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
        `echo "pulling..." 2>&1`,
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
        `git clean -xdf 2>&1`,
        `git reset --hard origin 2>&1`,
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

export async function _resetHard(
    repoDir: string,
) {
    // TODO: use git service
    // const command = `cd ${repoDir}; echo "${dummyStr}" > ".dummy"; git add .; git commit -m"${cmMsg}";`;
    const command = [
        `echo ">>>>>>>>>>" 2>&1`,
        `echo "cd..." 2>&1`,
        `cd ${repoDir} 2>&1`, 
        `echo "checking out..." 2>&1`,
        `git clean -xdf 2>&1`,
        `git reset --hard origin 2>&1`,
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