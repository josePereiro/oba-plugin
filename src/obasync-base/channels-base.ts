import { exec } from "child_process";
import { randstring } from "src/tools-base/utils-tools";

function _exec(command: string) {
    console.log("command:\n", command);
    exec(command, (error, stdout, stderr) => {
        if (error) {
        }
        if (stderr) {
        }
        if (stdout) {
            console.log(`Success stdout: ${stdout}`);
        }
    });
}

export function _d2rAddCommit(
    pushDepotDir: string,
    dummyStr: string = randstring()
) {
    // TODO: use git service
    const command = `cd ${pushDepotDir}; echo "${dummyStr}" > ".dummy"; git add .; git commit -m"obasync.pushed!";`;
    _exec(command)
}

export function _d2rPush(
    pushDepotDir: string
) {
    // TODO: use git service
    const dummyStr = randstring()
    const command = `cd ${pushDepotDir}; git push --all`;
    _exec(command)
}

export function _r2dPull(
    pullDepotDir: string
) {
    // TODO: use git service
    const command = `cd ${pullDepotDir}; git fetch --all; git pull`;
    _exec(command)
}
