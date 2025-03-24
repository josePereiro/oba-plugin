import { OBA } from "src/oba-base/globals";
import { crossref, localbibs } from "./0-biblio-base";
import { BiblIOData } from "./biblio-data";
import { tools } from "src/tools-base/0-tools-base";

export * from "./biblio-data"

/*
    Integrated tools to work with bibliography data
*/

export function onload() {
    // modules onload
    crossref.onload()
    localbibs.onload()

    // MARK: commands
    OBA.addCommand({
        id: 'oba-biblio-get-consensus-biblio',
        name: 'BiblIO get consensus biblIO',
        callback: async () => {
            console.clear();
            const sel = tools.getSelectedText();
            console.log("sel: ", sel);
            const data = await consensusBiblIO(sel);
            console.log("data: ", data);
        }
    });

    OBA.addCommand({
        id: 'oba-biblio-dev',
        name: 'BiblIO dev',
        callback: async () => {
            console.clear();
            const sel = tools.getSelectedText();
            console.log("sel: ", sel);
            const data = await consensusBiblIO(sel);
            console.log("data: ", data);
        }
    });
}

// MARK: consensus
/*
    merge biblIOs from several sources
*/ 
export async function consensusBiblIO(doi: string) {
    const rc_biblIO = await crossref.getBiblIO(doi);
    const lb_biblIO = await localbibs.getBiblIO(doi);
    
    const biblio: BiblIOData = {
        "doi":                  _getFirst("doi", lb_biblIO, rc_biblIO),
        "citekey":              _getFirst("citekey", lb_biblIO, rc_biblIO),
        "type":                 _getFirst("type", lb_biblIO, rc_biblIO),
        "title":                _getFirst("title", lb_biblIO, rc_biblIO),
        "authors":              _getFirst("authors", lb_biblIO, rc_biblIO),
        "created-date":         _getFirst("created-date", rc_biblIO, lb_biblIO),
        "deposited-date":       _getFirst("deposited-date", rc_biblIO, lb_biblIO),
        "published-date":       _getFirst("published-date", rc_biblIO, lb_biblIO),
        "issued-date":          _getFirst("issued-date", rc_biblIO, lb_biblIO),
        "journaltitle":         _getFirst("journaltitle", lb_biblIO, rc_biblIO),
        "url":                  _getFirst("url", lb_biblIO, rc_biblIO),
        "abstract":             _getFirst("abstract", lb_biblIO, rc_biblIO),
        "keywords":             _getFirst("keywords", lb_biblIO, rc_biblIO),
        "references-count":     _getFirst("references-count", rc_biblIO, lb_biblIO),
        "references-DOIs":      _getFirst("references-DOIs", rc_biblIO, lb_biblIO),
        "extras": {},
    }
    return biblio;
}

function _getFirst(key: string, ...objects: any[]) {
    for (const obj of objects) {
        const val = obj?.[key];
        if (val) { return val; }
    }
    return null
}
