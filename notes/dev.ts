/*
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



