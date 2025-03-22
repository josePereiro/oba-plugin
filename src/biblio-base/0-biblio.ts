import ObA from '../main-old';
import { BiblIOData } from './biblio-data';

/*
    Integrated tools to work with bibliography data
*/
export class BiblIO {

    constructor(private oba: ObA) {
        console.log("BiblIO:constructor");
    }

    // MARK: getters
    getDoi(biblio: BiblIOData) {
        return biblio["doi"]
    }
    getType(biblio: BiblIOData) {
        return biblio["type"]
    }
    getTitle(biblio: BiblIOData) {
        return biblio["title"]
    }
    getAuthors(biblio: BiblIOData) {
        return biblio["authors"]
    }
    getCreatedDate(biblio: BiblIOData) {
        return biblio["created-date"]
    }
    getDepositedDate(biblio: BiblIOData) {
        return biblio["deposited-date"]
    }
    getIssuedDate(biblio: BiblIOData) {
        return biblio["issued-date"]
    }
    getPublishedDate(biblio: BiblIOData) {
        return biblio["published-date"]
    }
    getJournalTitle(biblio: BiblIOData) {
        return biblio["journaltitle"]
    }
    getUrl(biblio: BiblIOData) {
        return biblio["url"]
    }
    getAbstract(biblio: BiblIOData) {
        return biblio["abstract"]
    }
    getKeywords(biblio: BiblIOData) {
        return biblio["keywords"]
    }
    getReferencesCount(biblio: BiblIOData) {
        return biblio["references-count"]
    }
    getReferencesDOIs(biblio: BiblIOData) {
        return biblio["references-DOIs"]
    }
    getExtras(biblio: BiblIOData) {
        return biblio["extras"]
    }

    // MARK: Consensus
    /*
        merge biblIOs from several sources
    */ 
    async consensusBiblIO(doi: string) {
        const rc_biblIO = await this.oba.crossref.getBiblio(doi);
        const lb_biblIO = await this.oba.localbibs.getBiblio(doi);
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


    // MARK: Utils
    findByDoi(
        doi0: string,
        objList: BiblIOData[] | null,
    ): BiblIOData | null {
        return this.oba.tools.findStr({
            str0: doi0,
            key: "doi",
            objList: objList,
            getEntry: (entry) => { return entry },
            foundFun: (_doi0: string, _doi1: string) => {
                return this.oba.tools.hasSuffix(_doi0, _doi1);
            }
        })
    }

    findByCiteKey(
        ckey0: string,
        objList: BiblIOData[] | null,
    ) {
        return this.oba.tools.findStr({
            str0: ckey0,
            key: "citekey",
            objList: objList,
            getEntry: (entry) => { return entry },
            foundFun: (_ckey0: string, _ckey1: string) => {
                return this.oba.tools.hasSuffix(_ckey0, _ckey1);
            }
        })
    }
}
