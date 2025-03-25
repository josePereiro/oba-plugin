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



