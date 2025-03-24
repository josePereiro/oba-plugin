import { OBA } from "src/oba-base/globals";
import { crossref, localbibs } from "./0-biblio-base";
import { BiblIOData } from "./biblio-data";
import { tools } from "src/tools-base/0-tools-base";

export * from "./biblio-data"

/*
    Integrated tools to work with bibliography data
*/

export function onload() {
    crossref.onload()
    localbibs.onload()

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
    const rc_biblIO = await crossref.getBiblio(doi);
    const lb_biblIO = await localbibs.getBiblio(doi);
    const biblio: BiblIOData = {
        "doi": lb_biblIO?.["doi"] ?? rc_biblIO?.["doi"],
        "citekey": lb_biblIO?.["citekey"] ?? rc_biblIO?.["citekey"],
        "type": lb_biblIO?.["type"] ?? rc_biblIO?.["type"],
        "title": lb_biblIO?.["title"] ?? rc_biblIO?.["title"],
        "authors": lb_biblIO?.["authors"] ?? rc_biblIO?.["authors"],
        "created-date": rc_biblIO?.["created-date"] ?? rc_biblIO?.["created-date"],
        "deposited-date": rc_biblIO?.["deposited-date"] ?? rc_biblIO?.["deposited-date"],
        "published-date": rc_biblIO?.["published-date"] ?? rc_biblIO?.["published-date"],
        "issued-date": rc_biblIO?.["issued-date"] ?? rc_biblIO?.["issued-date"],
        "journaltitle": lb_biblIO?.["journaltitle"] ?? rc_biblIO?.["journaltitle"],
        "url": lb_biblIO?.["url"] ?? rc_biblIO?.["url"],
        "abstract": lb_biblIO?.["abstract"] ?? rc_biblIO?.["abstract"],
        "keywords": lb_biblIO?.["keywords"] ?? rc_biblIO?.["keywords"],
        "references-count": rc_biblIO?.["references-count"] ?? lb_biblIO?.["references-count"],
        "references-DOIs": rc_biblIO?.["references-DOIs"] ?? lb_biblIO?.["references-DOIs"],
        "extras": {},
    }
    return biblio;
}


// MARK: utils
export function findByDoi(
    doi0: string,
    objList: BiblIOData[] | null,
): BiblIOData | null {
    return tools.findStr({
        str0: doi0,
        key: "doi",
        objList: objList,
        getEntry: (entry) => { return entry },
        foundFun: (_doi0: string, _doi1: string) => {
            return tools.hasSuffix(_doi0, _doi1);
        }
    })
}

export function findByCiteKey(
    ckey0: string,
    objList: BiblIOData[] | null,
) {
    return tools.findStr({
        str0: ckey0,
        key: "citekey",
        objList: objList,
        getEntry: (entry) => { return entry },
        foundFun: (_ckey0: string, _ckey1: string) => {
            return tools.hasSuffix(_ckey0, _ckey1);
        }
    })
}
