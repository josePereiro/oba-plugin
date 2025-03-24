import { OBA } from "src/oba-base/globals";
import { crossref, localbibs } from "./0-biblio-modules";
import { BiblIOData, BiblIOIder } from "./biblio-data";
import { tools } from "src/tools-base/0-tools-modules";

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
            const data = await consensusBiblIO({"query": sel});
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
            const data = await consensusReferences({"query": sel});
            console.log("data: ", data);
        }
    });
}

// MARK: consensus
/*
    merge biblIOs from several sources
*/ 
export async function consensusBiblIO(id: BiblIOIder) {

    // handle id
    const valid = await resolveDoi(id);
    if (!valid) { return null } 
    
    // get data
    const doi0 = id["doi"]
    console.log("doi0: ", doi0)
    const rc_biblIO = await crossref.getBiblIO(doi0);
    const lb_biblIO = await localbibs.getBiblIO(doi0);

    function _getFirst(key: string, ...objects: any[]) {
        for (const obj of objects) {
            const val = obj?.[key];
            if (val) { return val; }
        }
        return null
    }    
    
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

export async function consensusReferences(id: BiblIOIder) {

    // handle id
    const valid = await resolveDoi(id);
    if (!valid) { return null } 

    const biblIO0 = await consensusBiblIO(id)
    if (!biblIO0) { return null }
    const dois = biblIO0["references-DOIs"]
    if (!dois) { return null }

    const refs: (BiblIOData | null)[] = []
    for (const doi1 of dois) {
        if (doi1) {
            const biblIO1 = await consensusBiblIO({"doi": doi1})
            refs.push(biblIO1)
        } else {
            refs.push(null)
        }
    }
    return refs
}


// MARK: utils
async function resolveDoi(id: BiblIOIder) {
    if (id?.["doi"]) { return true; } 
    if (id?.["citekey"]) {
        const lb_biblIO = await localbibs.findByCiteKey(id["citekey"])
        id["doi"] = lb_biblIO?.["doi"]
        return true; 
    } 
    if (id?.["query"]) {
        // local search first
        let lb_biblIO;
        lb_biblIO = await localbibs.findByCiteKey(id["query"])
        if (lb_biblIO) {
            id["doi"] = lb_biblIO?.["doi"]
            return true; 
        }
        lb_biblIO = await localbibs.findByDoi(id["query"])
        if (lb_biblIO) {
            id["doi"] = lb_biblIO?.["doi"]
            return true; 
        }
        // default to doi
        id["doi"] = id["query"]
        return true; 
    }
    return false; 
}