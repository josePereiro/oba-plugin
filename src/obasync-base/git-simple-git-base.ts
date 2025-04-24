// import { readdir, rm, writeFile } from "fs/promises";
// import path from "path";
// import { TaskState } from "src/tools-base/schedule-tools";
// import { execAsync } from "src/tools-base/utils-tools";
// import { ObaSyncScheduler } from "./obasync";
// import simpleGit, { SimpleGit } from "simple-git";


// /*
// …or create a new repository on the commandv line
// echo "# Bare-Repo-Template" >> README.md
// git init
// git add README.md
// git commit -m "first commit"
// git branch -M main
// git remote add origin https://github.com/josePereiro/Bare-Repo-Template.git
// git push -u origin main
// */ 

// /*
// …or push an existing repository from the commandv line
// git remote add origin https://github.com/josePereiro/Bare-Repo-Template.git
// git branch -M main
// git push -u origin main
// */ 


// /*
//     //TODO/ Force repo name convention
//         - push-... and pull-...
//         - This avoid a same folder to be used for push and pull
//     //TODO/ Think about an stage folder for pushing
// */ 

// // MARK: addDummyAndCommit
// export async function _addDummyAndCommit(
//     repoDir: string,
//     cmMsg: string = "obasync.pushed!",
//     dummyStr: string = "123"
// ) {
//     const git: SimpleGit = simpleGit(repoDir);

//     try {
//         console.log('>>>>>>>>>>');
//         console.log('_addDummyAndCommit');

//         // Show remote and status
//         console.log(await git.remote(['-v']));
//         console.log(await git.status());

//         console.log('----------');
//         console.log('touching dummy...');
        
//         // Create dummy file
//         await writeFile(`${repoDir}/.dummy`, dummyStr);
//         console.log(await git.status());

//         console.log('----------');
//         console.log('adding...');
        
//         // Stage all changes
//         await git.add('.');
//         console.log(await git.status());

//         console.log('----------');
//         console.log('committing...');
        
//         // Commit changes
//         await git.commit(cmMsg);
//         console.log(await git.status());

//         console.log('----------');
//         console.log('done');
//         console.log('<<<<<<<<<<');
//     } catch (error) {
//         console.error('Error in _addDummyAndCommit:', error);
//         throw error;
//     }
// }

// export function _spawnAddDummyAndCommit(
//     repoDir: string,
//     cmMsg: string = "obasync.pushed!",
//     dummyStr: string = "123"
// ) {
//     _spawnToTheEnd(`_addDummyAndCommit:${repoDir}`, async () => {
//         await _addDummyAndCommit(repoDir, cmMsg, dummyStr)
//     })
// }

// // MARK: justPush
// export async function _justPush(
//     repoDir: string,
//     {
//         tout = 10 // secs
//     } = {}
// ) {
//     const git: SimpleGit = simpleGit(repoDir);

//     try {
//         console.log('>>>>>>>>>>');
//         console.log('_justPush');

//         // Show remote and status
//         console.log(await git.remote(['-v']));
//         console.log(await git.status());

//         console.log('----------');
//         console.log('pushing...');

//         // Set environment variables for the push operation
//         process.env.GIT_HTTP_LOW_SPEED_LIMIT = '0';
//         process.env.GIT_HTTP_LOW_SPEED_TIME = tout.toString();

//         // Push all branches
//         const pushResult = await git.push('--all');
//         console.log(pushResult);

//         // Show final status
//         console.log(await git.status());

//         console.log('----------');
//         console.log('done');
//         console.log('<<<<<<<<<<');

//         return pushResult;
//     } catch (error) {
//         console.error('Error in _justPush:', error);
//         throw error;
//     } finally {
//         // Clean up environment variables
//         delete process.env.GIT_HTTP_LOW_SPEED_LIMIT;
//         delete process.env.GIT_HTTP_LOW_SPEED_TIME;
//     }
// }

// export function _spawnJustPush(
//     repoDir: string, 
//     {
//         tout = 10, // secs
//     } = {}
// ) {
//     _spawnToTheEnd(`_justPush:${repoDir}`, async () => {
//         await _justPush(repoDir, { tout })
//     })
// }

// // MARK: _addDummyAndCommitAndPush
// export async function _addDummyAndCommitAndPush(
//     repoDir: string,
//     cmMsg: string = "obasync.pushed!",
//     dummyStr: string = "123",
//     {
//         tout = 10, // secs
//     } = {}
// ) {
//     await _addDummyAndCommit(repoDir, cmMsg, dummyStr)
//     await _justPush(repoDir, { tout })
// }
// export function _spawnAddDummyAndCommitAndPush(
//     repoDir: string,
//     cmMsg: string = "obasync.pushed!",
//     dummyStr: string = "123",
//     {
//         tout = 10, // secs
//     } = {}
// ) {
//     _spawnToTheEnd(`_addDummyAndCommitAndPush:${repoDir}`, async () => {
//         await _addDummyAndCommitAndPush(repoDir, cmMsg, dummyStr, { tout })
//     })
// }

// // MARK: fetchCheckoutPull
// export async function _fetchCheckoutPull(
//     repoDir: string,
//     {
//         tout = 10, // seconds
//         resetCommit = 'HEAD~1'
//     } = {}
// ) {
//     const git: SimpleGit = simpleGit(repoDir);

//     try {
//         console.log('>>>>>>>>>>');
//         console.log('_fetchCheckoutPull');

//         // Show remote and status
//         console.log(await git.remote(['-v']));
//         const initialStatus = await git.status();
//         console.log(initialStatus);

//         // Get current branch name
//         const currentBranch = initialStatus.current || 'main';

//         console.log('----------');
//         console.log('fetching...');

//         // Set environment variables
//         process.env.GIT_HTTP_LOW_SPEED_LIMIT = '0';
//         process.env.GIT_HTTP_LOW_SPEED_TIME = tout.toString();

//         // Fetch all remotes
//         const fetchResult = await git.fetch(['--all']);
//         console.log(fetchResult);
//         console.log(await git.status());

//         console.log('----------');
//         console.log('resetting...');

//         // Hard reset to specified commit
//         await git.reset(['--hard', resetCommit]);
//         console.log(await git.status());

//         console.log('----------');
//         console.log('cleaning...');

//         // Clean untracked files and directories
//         await git.clean('f', ['-x', '-d']);
//         console.log(await git.status());

//         console.log('----------');
//         console.log('merging...');

//         // Merge from the remote tracking branch (origin/branchName)
//         const mergeResult = await git.merge([`origin/${currentBranch}`]);
//         console.log(mergeResult);
//         console.log(await git.status());

//         console.log('----------');
//         console.log('done');
//         console.log('<<<<<<<<<<');

//         return {
//             currentBranch,
//             fetchResult,
//             mergeResult,
//             finalStatus: await git.status()
//         };
//     } catch (error) {
//         console.error('Error in _fetchCheckoutPull:', error);
//         throw error;
//     } finally {
//         // Clean up environment variables
//         delete process.env.GIT_HTTP_LOW_SPEED_LIMIT;
//         delete process.env.GIT_HTTP_LOW_SPEED_TIME;
//     }
// }

// export function _spawnFetchCheckoutPull(
//     repoDir: string, 
//     {
//         tout = 10, // secs
//         resetCommit = 'HEAD~5'
//     } = {}
// ) {
//     _spawnToTheEnd(`_fetchCheckoutPull:${repoDir}`, async () => {
//         await _fetchCheckoutPull(repoDir, { resetCommit, tout })
//     })
// }

// // MARK: _resetHard
// export async function resetHard(
//     repoDir: string,
//     { resetCommit = 'origin' } = {}
// ) {
//     const git: SimpleGit = simpleGit(repoDir);

//     try {
//         console.log('>>>>>>>>>>');
//         console.log('_resetHard');

//         // Show remote and status
//         console.log(await git.remote(['-v']));
//         const status = await git.status();
//         console.log(status);

//         console.log('----------');
//         console.log('checking out...');

//         // Clean untracked files and directories
//         await git.clean('f', ['-x', '-d']);
        
//         // Hard reset to specified commit
//         await git.reset(['--hard', resetCommit]);

//         console.log('----------');
//         console.log('done');
//         console.log('<<<<<<<<<<');

//         return {
//             previousBranch: status.current,
//             resetTo: resetCommit,
//             newStatus: await git.status()
//         };
//     } catch (error) {
//         console.error('Error in _resetHard:', error);
//         throw error;
//     }
// }

// export function _spawnResetHard(
//     repoDir: string,
//     { resetCommit = 'origin' } = {}
// ) {
//     _spawnToTheEnd(`_resetHard:${repoDir}`, async () => {
//         await _resetHard(repoDir, { resetCommit})
//     })
// }

// // MARK: _clearWD
// export async function _clearWD(
//     repoDir: string,
// ) {
//     const files = await readdir(repoDir);
//     for (const file of files) {
//         if (file == ".git") { continue; }
//         const fullPath = path.join(repoDir, file);
//         rm(fullPath, { recursive: true, force: true })
//     }
// }

// export function _spawnCleatWD(
//     repoDir: string,
// ) {
//     _spawnToTheEnd(`_clearWD:${repoDir}`, async () => {
//         await _clearWD(repoDir)
//     })
// }

// // MARK: utils
// function _spawnToTheEnd(
//     id: string, 
//     taskFun: (() => any),
//     initGas = 100
// ) {
//     ObaSyncScheduler.spawn({
//         id: `spawnJustPush:${id}`,
//         taskFun: async (task: TaskState) => {
//             // clamp down
//             if (task["gas"] > initGas) { 
//                 task["gas"] = initGas
//                 return; 
//             } 
//             if (task["gas"] > 0) { return; } // ignore till the end
//             await taskFun()
//         }, 
//         deltaGas: initGas
//     })
// }