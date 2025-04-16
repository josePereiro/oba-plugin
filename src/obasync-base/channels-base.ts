import { exec } from "child_process";

export function _d2rPush(
    pushDepotDir: string
) {
    // TODO: use git service
    const command = `cd ${pushDepotDir}; git add .; git commit -m"obasync.pushed!"; git push --all`;
    console.log("command:\n", command);
    exec(command, (error, stdout, stderr) => {
        if (stdout) {
            console.log(`Stdout: ${stdout}`);
        }
        console.log(`Executed: ${command}`);
    });
}

export function _r2dPull(
    pullDepotDir: string
) {
    // TODO: use git service
    const command = `cd ${pullDepotDir}; git add .; git fetch --all; git pull`;
    console.log("command:\n", command);
    exec(command, (error, stdout, stderr) => {
        if (stdout) {
            console.log(`Stdout: ${stdout}`);
        }
        console.log(`Executed: ${command}`);
    });
}
