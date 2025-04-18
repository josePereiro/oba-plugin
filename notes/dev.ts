/*
TODO/TAI:
    - Some signals needs to be republished
        - This is important to comunicate signal in the intersection of two subvaults
        - This signals must be unmodified, so, the system reach a fix point
        - The problem is that you need to create a scope resolution mechanism
            - Which signals must be or not republish from one channel to another.
            - This mechanism must be a per-signal mechanism.
                - That is, the arguments of the signal matter, not only its type. 
    - 


DONE/ Manifest system
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

TODO:
-DONE/100% Create a general get/set/getset/write/load interface for handling JSON files
    - Similar to blobio
    - Potential name: jsonio
- DONE/80% Migrate config procesing to jsonio
- Propagate the RefResolverMap interface to biblIO to handle references
    - An array is not sufficiently flexible
- Resolve the CitNotes citekey problem
    - Getting the citekey from the name is not ideal
        - Maybe use the YAML section
        - Maybe use the note configuration
    - This could help define what constitutes a CitNote
- Consider the problem of empty or invalid BiblIOData
- Work on installation tools
- Work on (git) synchronization tools
*/

/*
# DESIGN v1
- TODO/ Add replacer (line by line)
- TODO/ Study Obsidian API documentation 
    - ex: https://docs.obsidian.md/Plugins/Vault
    - Use more and more Obsidian interface
- TODO/ Finish Replacer
    - dev a set of built-in tokens (ej: #!mdate, {{title}}, {{DOI}})
    - Add custom code capabilities as templater
- TODO/ Finish Line Commands
    - A one line command which allow trigger actions with arguments
    - The one line is just a json with a trigger token
        - ex %% #!{ "fun": "replace", "args": ["[47]", "refLink(47)"]} %%
    - One nice thing is while this line is in place, the code will execute
    - The execution is triggered by a command
        - Only in the scope of the current note.
    _ usage case
        - %% #!{ "action": "num-citation", "prefix": "- citations"} %%
            - expand to '- citations: 14 %% #!{ "action": "num-citation", "prefix": "- citations"} %%'
*/ 



