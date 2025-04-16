import { _serviceCommands } from "./commands-base";
import { _serviceCallbacks } from "./callbacks-base";

/*
    Main module to handle syncronization with other vaults
*/

/*
// DEV channel setup
// user1
"https://github.com/josePereiro/TankeFactory-user1-push-repo"
"/Users/Pereiro/Documents/Obsidian/obasync-dev-remotes/TankeFactory-user1-push-repo"
// user2
"https://github.com/josePereiro/TankeFactory-user2-push-repo"
"/Users/Pereiro/Documents/Obsidian/obasync-dev-remotes/TankeFactory-user2-push-repo"
*/

/*
    DOING/ Manifest system
    - send a signal with the las action
    - each action has a timetag
    - a push-action will create a new timetag
    - a pull-action will contain the timetag of a push action
    - or in case of spontaneaous pull, a new timetag
    - a general action-manifest for each user
        - contain a summary
    - a per note action-manifest for each use
        - contain detailed actions for each note
        - it might even contain a log of past actions

    - // TODO, at some point, I can split the depot manifest 
    // in different files, for instance, a file for each first letter of a key.
    // This to avoid loading/writing a big file
*/ 

export function onload() {
    console.log("ObaSync:onload");
    _serviceCommands()
    _serviceCallbacks()
}
