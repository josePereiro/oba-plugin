import ObA from './main';

/*
    Handle citation notes.
    - parse metadata from citation notes
        - keep a cache of such metadata
    - Notify when format is invalid
    - Replacements
        - Replace #!REF13 by the citekey if it is present in the bibtex db
            - Use crossref for getting References
*/
export class CitationNotes {

    constructor(private oba: ObA) {
        console.log("CitationNotes:constructor");
    }

    getNoteDoi() {
        
    }

}