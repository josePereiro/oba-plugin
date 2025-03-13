// DeepSeek
import ObA from './main';
// import {BibtexParser} from "bibtex-js-parser";
import { parse } from '@retorquere/bibtex-parser';
import { readFileSync } from 'fs';

export class BibTex {

    constructor(private oba: ObA) {
        console.log("BibTex:constructor");
        this.oba.addCommand({
            id: "load-bib",
            name: "Load local .bib",
            callback: () => {
                const pdfsDir = this.oba.configfile.readConfig("local.bib.file")
                const ret = this.parseBibFile(pdfsDir);
                console.log(ret);
            },
        });
    }

    parseBibFile(filePath: string): any {
        try {
            // Read the .bib file
            const bibContent = readFileSync(filePath, 'utf-8');

            // Parse the .bib content into JSON
            // const parsedBib = BibtexParser.parseToJSON(bibContent);
            const parsedBib = parse(bibContent);
            return parsedBib;
        } catch (error) {
            console.error('Error reading or parsing .bib file:', error);
            throw error;
        }
    }
}