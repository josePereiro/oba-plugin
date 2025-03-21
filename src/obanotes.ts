import { basename } from 'path';
import ObA from './main';

/*
    Handle the manipulation of note
    - for instance:
        - Create new notes with a given template
        - Extract section to separe notes
*/
export class ObaNotes {

    constructor(private oba: ObA) {
        console.log("ObaNotes:constructor");

        this.oba.addCommand({
            id: "obanotes-subnote-link",
            name: "ObaNotes subnote link",
            callback: async () => {
                console.clear()
                const link = this.subNoteLinkFromSelection()
                await this.oba.tools.copyToClipboard(link)
            },
        });
    }

    subNoteLinkFromSelection() {
        const path = this.oba.tools.getCurrNotePathErr()
        const name0 = basename(path).
            replace(/.md$/, '')
        const sel = this.oba.tools.getSelectedText().trim();
        let name1 = this.oba.tools.fixPoint(sel, (stri) => {
            return stri.trim().replace(/[^a-zA-Z0-9\s\-_]/g, '')
        })
        name1 = this.oba.tools.toCamelCase(name1)
        return `[[sub - ${name1} - ${name0}|${sel}]]`
    }
}