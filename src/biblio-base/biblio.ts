import { OBA } from "src/oba-base/globals";
import { crossref, localbibs } from "./0-biblio-modules";
import { BiblIOData, BiblIOIder } from "./biblio-data";
import { tools } from "src/tools-base/0-tools-modules";
export * from "./biblio-data"

/*
    Integrated tools to work with bibliography data
    // TODO/TAI create local/online search interface
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
    
    const biblio: BiblIOData = {
        "doi":                  _extractFirst("doi", lb_biblIO, rc_biblIO),
        "citekey":              _extractFirst("citekey", lb_biblIO, rc_biblIO),
        "type":                 _extractFirst("type", lb_biblIO, rc_biblIO),
        "title":                _extractAsPlainText("title", lb_biblIO, rc_biblIO),
        "authors":              _extractFirst("authors", lb_biblIO, rc_biblIO),
        "created-date":         _extractFirst("created-date", rc_biblIO, lb_biblIO),
        "deposited-date":       _extractFirst("deposited-date", rc_biblIO, lb_biblIO),
        "published-date":       _extractFirst("published-date", rc_biblIO, lb_biblIO),
        "issued-date":          _extractFirst("issued-date", rc_biblIO, lb_biblIO),
        "journaltitle":         _extractFirst("journaltitle", lb_biblIO, rc_biblIO),
        "url":                  _extractFirst("url", lb_biblIO, rc_biblIO),
        "abstract":             _extractAsPlainText("abstract", lb_biblIO, rc_biblIO),
        "keywords":             _extractFirst("keywords", lb_biblIO, rc_biblIO),
        "references-count":     _extractFirst("references-count", rc_biblIO, lb_biblIO),
        "references-DOIs":      _extractFirst("references-DOIs", rc_biblIO, lb_biblIO),
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

// MARK: extract
function _formatToSimpleLine(text: string | null) {
    if (!text) { return text; }
    return tools.fixPoint(text, (texti: string) => {
        return texti.trim().
            replace(/<[^>]*?>/, "").
            replace(/\n/, "").
            replace(/\s\s/, "")
    })
}

function _extractFirst(key: string, ...objects: any[]) {
    for (const obj of objects) {
        const val = obj?.[key];
        if (val) { return val; }
    }
    return null
}    

function _extractAsPlainText(...objects: any[]) {
    const title = _extractFirst("title", ...objects)
    return _formatToSimpleLine(title)
}


// MARK: ider
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