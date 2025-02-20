// import axios from 'axios';
import { Notice } from 'obsidian';
import ObA from './main';

export class CrossRef {
    private readonly baseUrl = 'https://api.crossref.org/works';

    constructor(private oba: ObA) {
        console.log("CrossRef:constructor");
    }

    async fetchDoiReference() {
        // const doi = await this.promptForDoi();
        // const doi = "https://doi.org/10.1038/srep45303";
        const doi = this.oba.tools.getSelectedText()
        if (!doi) {
            new Notice('Select a doi');
            return;
        }

        const url = `https://api.crossref.org/works/${doi}`;
        try {
            new Notice('Sending request');
            const response = await fetch(url);
            if (!response.ok) {
                new Notice(`Server error, check selected doi.\ndoi: ${doi}`);
            }
            const data = await response.json();
            console.log("data");
            console.log(data);

            const msg = data['message'] ?? null
            if (!msg) {
                console.log('message missing')
                return;
            }

            console.log('reference-count');
            console.log(msg['reference-count'] ?? msg['references-count'] ?? 'missing');

            const refobjs = msg['reference'] ?? null
            if (!refobjs) {
                console.log('refobjs missing')
                new Notice(`Sorry, references missing.\ndoi: ${doi}`);
                return;
            }

            const refcites = [];
            for (let i = 0; i < refobjs.length; i++) {
                let _ref_str = `[${i + 1}]`;
                const __doi = refobjs[i]['DOI'] ?? refobjs[i]['doi'] ?? '';
                const _doi = this.formatDoi(__doi);
                if (_doi) { _ref_str += ` ${_doi}`; }
                const _year = refobjs[i]['year'] ?? '';
                if (_year) { _ref_str += ` (${_year})`; }
                const _cite = refobjs[i]['unstructured'] ?? 'missing';
                _ref_str += ` ${_cite}`
                console.log(_ref_str);
                refcites.push(_ref_str);
            }
            const reference_section = refcites.join('\n');
            this.oba.tools.copyToClipboard(reference_section);
            new Notice(`SUCESS!!! Reference copied to clipboard.\ndoi: ${doi}`)
        } catch (error) {
            console.error('Error fetching DOI reference:', error);
            new Notice(`Server error, check selected doi. ${doi}`);
        }
    }

    formatDoi(doi: string): string {
        if (doi == '') {
            return ''
        }
        if (!doi.startsWith('https://doi.org/')) {
            // Add the prefix
            return 'https://doi.org/' + doi;
        }
        return doi
    }

    async promptForDoi() {
        const doi = await this.oba.app.workspace.activeEditor?.editor?.getSelection() || prompt('Enter the DOI:');
        return doi?.trim();
    }

}

// Example usage:
// const service = new CrossRef('your@email.com');
// const references = await service.fetchReferencesByDOI('10.1038/nature12345');
// console.log(references);



// import { App, Plugin, PluginSettingTab, Setting } from 'obsidian';

// export default class DoiReferencePlugin extends Plugin {
//     async onload() {
//         this.addCommand({
//             id: 'fetch-doi-reference',
//             name: 'Fetch DOI Reference',
//             callback: () => this.fetchDoiReference(),
//         });
//     }



//     async promptForDoi() {
//         const doi = await this.app.workspace.activeEditor?.editor?.getSelection() || prompt('Enter the DOI:');
//         return doi?.trim();
//     }

//     formatReference(data) {
//         const authors = data.author.map(a => `${a.given} ${a.family}`).join(', ');
//         const title = data.title[0];
//         const journal = data['container-title'][0];
//         const year = data.issued['date-parts'][0][0];
//         const volume = data.volume;
//         const issue = data.issue;
//         const pages = data.page;

//         return `**${authors}** (${year}). ${title}. *${journal}*, ${volume}(${issue}), ${pages}. https://doi.org/${data.DOI}`;
//     }

//     insertReferenceIntoNote(reference) {
//         const editor = this.app.workspace.activeEditor?.editor;
//         if (editor) {
//             editor.replaceSelection(reference);
//         }
//     }
// }