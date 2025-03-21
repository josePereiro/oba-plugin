import { Notice } from 'obsidian';
import ObA from '../main';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { BiblIOAuthor, BiblIOData, BiblIODate } from './bibl.io.data';

/*
    Use CrossRef API to download papers metadata
    // Basically, given a doi, It fetch its data from crossref.
    // Also, mantain a cache (local to the vault)
    // Include the interface to Biblio.
*/
export class CrossRefBase {

    constructor(public oba: ObA) {
        console.log("CrossRefBase:constructor");
    }

    // MARK: biblio
    async getBiblio(doi0: string) {
        const doi = this.oba.tools.absDoi(doi0);
        const cr_data = await this.getCrossrefData(doi)
        const biblio: BiblIOData = {
            "doi": this.extractDoi(cr_data),
            "citekey": this.extractCiteKey(cr_data),
            "type": this.extractType(cr_data),
            "title": this.extractTitle(cr_data),
            "authors": this.extractAuthors(cr_data),
            "created-date": this.extractCreatedDate(cr_data),
            "deposited-date": this.extractDepositedDate(cr_data),
            "issued-date": this.extractIssuedDate(cr_data),
            "published-date": this.extractPublishedDate(cr_data),
            "journaltitle": this.extractJournalTitle(cr_data),
            "url": this.extractURL(cr_data),
            "abstract": this.extractJournalAbstract(cr_data),
            "keywords": this.extractKeywords(cr_data),
            "references-count": this.extractReferencesCount(cr_data),
            "references-DOIs": this.extractReferencesDOIs(cr_data),
            "extras": this.extractExtras(cr_data),
        }
        return biblio
    }

    // MARK: fetch/load
    async fetchOnDemandCrossrefData(doi0: string) {
        const doi = this.oba.tools.absDoi(doi0);
        return this._fetchOnDemandCrossrefData(doi);
    }
    
    async getCrossrefData(doi0: string) {
        const doi = this.oba.tools.absDoi(doi0);
        this._fetchOnDemandCrossrefData(doi);
        return this._loadCache(doi);
    }

    async _fetchOnDemandCrossrefData(doi: string) {
        if (this._hasCache(doi)){ 
            console.log(`cached! ${doi}`)
            return; 
        }
        console.log(`fetching! ${doi}`)
        const cr_data = await this._fetchCrossrefData(doi)
        if (cr_data) { this._writeCache(doi, cr_data); } 
    }

    async _fetchCrossrefData(doi: string) {
        try {
            new Notice('Sending request');
            const url = `https://api.crossref.org/works/${doi}`;
            const response = await fetch(url);
            await sleep(101); // avoid abuse
            console.log('_fetchCrossrefData.response ', response)
            if (!response['ok']) {
                new Notice(`Server error, check selected doi.\ndoi: ${doi}`);
                return null
            }
            const cr_data = await response.json();
            console.log('_fetchCrossrefData.cr_data ', cr_data)
            return cr_data
        } catch (error) {
            console.error('Error fetching DOI reference:', error);
            new Notice(`Server error, check selected doi. ${doi}`);
            return null
        }
    }
    
    // MARK: cache
    getCrossrefDir(): string {
        const obaDir = this.oba.tools.getObaDir();
        const _dir = join(obaDir, "crossref");
        if (!existsSync(_dir)) {
            mkdirSync(_dir, { recursive: true });
        }
        return _dir;
    }

    _loadCache(doi: string) {
        const path = this._getCachePath(doi);
        return this.oba.tools.loadJSON(path);
    }

    _writeCache(doi: string, cr_data: any) {
        const path = this._getCachePath(doi);
        return this.oba.tools.writeJSON(path, cr_data);
    }

    _hasCache(doi: string) {
        const path = this._getCachePath(doi)
        return existsSync(path)
    }

    _getCachePath(doi: string): string {
        return join(
            this.getCrossrefDir(),
            this.oba.tools.uriToFilename(doi)
        )
    }

    // MARK: extract
    // All extract methods must return null if failed
    private extractDoi(cr_data: any): string | null {
        try {
            const dat0 = cr_data['message']["DOI"]
            if (!dat0) { return null; } 
            return this.oba.tools.absDoi(dat0);
        } catch (error) { return null; }
    }

    private extractCiteKey(cr_data: any): null {
        return null;
    }

    private extractType(cr_data: any): string | null {
        try{
            return cr_data['message']['type']
        } catch (error) { return null; }
    }

    private extractTitle(cr_data: any): string | null {
        try{
            const dat0 = cr_data['message']['title'][0]
            if (!dat0) { return null}
            return dat0
        } catch (error) { return null; }
    }

    private extractAuthors(cr_data: any): BiblIOAuthor[] | null {
        try{
            const dat0 = cr_data['message']["author"]
            if (!dat0) { return null; }
            const authors: BiblIOAuthor[] = [];
            for (const authori of dat0) {
                const affiliations: string[] = [];
                for (const affi of authori['affiliation']) {
                    affiliations.push(affi["name"])
                }
                const author: BiblIOAuthor = {
                    "firstName": authori?.["given"] ?? '',
                    "lastName": authori?.["family"] ?? '',
                    "ORCID": authori?.["ORCID"] ?? null,
                    "affiliations": affiliations,
                }
                authors.push(author);
            }
            return authors;
        } catch (error) { return null; }
    }

    private extractCreatedDate(cr_data: any): BiblIODate | null {
        try {
            const dat0 = cr_data['message']["created"]
            const dat1 = dat0["date-parts"][0]
            const date: BiblIODate = {
                "year": dat1[0],
                "month": dat1?.[1] ?? null,
                "day": dat1?.[2] ?? null,
            }
            return date
        } catch (error) { return null; }
    }

    private extractDepositedDate(cr_data: any): BiblIODate | null {
        try {
            const dat0 = cr_data['message']["deposited"]
            const dat1 = dat0["date-parts"][0]
            const date: BiblIODate = {
                "year": dat1[0],
                "month": dat1?.[1] ?? null,
                "day": dat1?.[2] ?? null,
            }
            return date
        } catch (error) { return null; }
    }

    private extractIssuedDate(cr_data: any): BiblIODate | null {
        try {
            const dat0 = cr_data['message']["issued"]
            const dat1 = dat0["date-parts"][0]
            const date: BiblIODate = {
                "year": dat1[0],
                "month": dat1?.[1] ?? null,
                "day": dat1?.[2] ?? null,
            }
            return date
        } catch (error) { return null; }
    }

    private extractPublishedDate(cr_data: any): BiblIODate | null {
        try {
            const dat0 = cr_data['message']["published"]
            const dat1 = dat0["date-parts"][0]
            const date: BiblIODate = {
                "year": dat1[0],
                "month": dat1?.[1] ?? null,
                "day": dat1?.[2] ?? null,
            }
            return date
        } catch (error) { return null; }
    }   

    private extractJournalTitle(cr_data: any): string | null {
        try {
            const dat0 = cr_data['message']["publisher"]
            if (!dat0) { return null}
            return dat0
        } catch (error) { return null; }
    }

    private extractURL(cr_data: any): string | null {
        try {
            const dat0 = cr_data['message']["URL"]
            if (!dat0) { return null}
            return dat0
        } catch (error) { return null; }
    }

    private extractJournalAbstract(cr_data: any): string | null {
        try {
            const dat0 = cr_data['message']["abstract"]
            if (!dat0) { return null}
            return dat0
        } catch (error) { return null; }
    }

    private extractKeywords(cr_data: any): null {
        return null
    }

    private extractReferencesCount(cr_data: any) {
        try {
            const dat0 = cr_data['message']["references-count"]
            if (!dat0) { return null}
            return dat0
        } catch (error) { return null; }
    }

    private extractReferencesDOIs(cr_data: any): string[] | null {
        try {
            const dat0 = cr_data['message']["reference"]
            if (!dat0) { return null}
            const dois: string[] = [];
            for (const refi of dat0) {
                const doi0 = refi?.["DOI"] ?? ''
                const doi1 = this.oba.tools.absDoi(doi0);
                dois.push(doi1)
            }
            return dois
        } catch (error) { return null; }
    }

    private extractExtras(cr_data: any): any {
        return { "crossref": cr_data }
    }

}

/*
// MARK: Example: cr_data 
{
    "status": "ok",
    "message-type": "work",
    "message-version": "1.0.0",
    "message": {
        ...
        "reference-count": 96,
        "publisher": "American Society for Microbiology",
        "issue": "2",
        ...
        "abstract": "<jats:p>It is generally recognized that proteins constitute the key cellular component in shaping microbial phenotypes. Due to limited cellular resources and space, optimal allocation of proteins is crucial for microbes to facilitate maximum proliferation rates while allowing a flexible response to environmental changes.</jats:p>",
        "DOI": "10.1128/msystems.00625-20",
        "type": "journal-article",
        "created": {
            "date-parts": [
                [
                    2021,
                    3,
                    8
                ]
            ],
            "date-time": "2021-03-08T14:18:01Z",
            "timestamp": 1615213081000
        },
        "update-policy": "http://dx.doi.org/10.1128/asmj-crossmark-policy-page",
        "source": "Crossref",
        "is-referenced-by-count": 10,
        "title": [
            "Proteome Regulation Patterns Determine Escherichia coli Wild-Type and Mutant Phenotypes"
        ],
        "prefix": "10.1128",
        "volume": "6",
        "author": [
            {
                "ORCID": "http://orcid.org/0000-0002-9593-4388",
                "authenticated-orcid": true,
                "given": "Tobias B.",
                "family": "Alter",
                "sequence": "first",
                "affiliation": [
                    {
                        "name": "Institute of Applied Microbiology (iAMB), Aachen Biology and Biotechnology (ABBt), RWTH Aachen University, Aachen, Germany"
                    }
                ]
            },
            {
                "given": "Lars M.",
                "family": "Blank",
                "sequence": "additional",
                "affiliation": [
                    {
                        "name": "Institute of Applied Microbiology (iAMB), Aachen Biology and Biotechnology (ABBt), RWTH Aachen University, Aachen, Germany"
                    }
                ]
            },
            {
                "ORCID": "http://orcid.org/0000-0001-9425-7509",
                "authenticated-orcid": true,
                "given": "Birgitta E.",
                "family": "Ebert",
                "sequence": "additional",
                "affiliation": [
                    {
                        "name": "Institute of Applied Microbiology (iAMB), Aachen Biology and Biotechnology (ABBt), RWTH Aachen University, Aachen, Germany"
                    },
                    {
                        "name": "Australian Institute for Bioengineering and Nanotechnology (AIBN), The University of Queensland, Brisbane, Australia"
                    }
                ]
            }
        ],
        "member": "235",
        "reference": [
            {
                "key": "e_1_3_3_2_2",
                "doi-asserted-by": "publisher",
                "DOI": "10.1146/annurev.mi.03.100149.002103"
            },
            {
                "key": "e_1_3_3_3_2",
                "doi-asserted-by": "publisher",
                "DOI": "10.1016/j.cell.2009.12.001"
            },
            ...
        ],
        "container-title": [
            "mSystems"
        ],
        "original-title": [],
        "language": "en",
        "link": [
            {
                "URL": "https://journals.asm.org/doi/pdf/10.1128/msystems.00625-20",
                "content-type": "application/pdf",
                "content-version": "vor",
                "intended-application": "text-mining"
            },
            {
                "URL": "https://journals.asm.org/doi/pdf/10.1128/msystems.00625-20",
                "content-type": "unspecified",
                "content-version": "vor",
                "intended-application": "similarity-checking"
            }
        ],
        "deposited": {
            "date-parts": [
                [
                    2024,
                    8,
                    11
                ]
            ],
            "date-time": "2024-08-11T19:01:13Z",
            "timestamp": 1723402873000
        },
        "score": 1,
        "resource": {
            "primary": {
                "URL": "https://journals.asm.org/doi/10.1128/msystems.00625-20"
            }
        },
        "subtitle": [],
        "editor": [
            {
                "given": "Joshua E.",
                "family": "Elias",
                "sequence": "additional",
                "affiliation": []
            }
        ],
        "short-title": [],
        "issued": {
            "date-parts": [
                [
                    2021,
                    4,
                    27
                ]
            ]
        },
        "references-count": 96,
        "journal-issue": {
            "issue": "2",
            "published-print": {
                "date-parts": [
                    [
                        2021,
                        4,
                        27
                    ]
                ]
            }
        },
        "alternative-id": [
            "10.1128/msystems.00625-20"
        ],
        "URL": "https://doi.org/10.1128/msystems.00625-20",
        "relation": {},
        "ISSN": [
            "2379-5077"
        ],
        "issn-type": [
            {
                "type": "electronic",
                "value": "2379-5077"
            }
        ],
        "subject": [],
        "published": {
            "date-parts": [
                [
                    2021,
                    4,
                    27
                ]
            ]
        },
        "assertion": [
            {
                "value": "2020-07-09",
                "order": 0,
                "name": "received",
                "label": "Received",
                "group": {
                    "name": "publication_history",
                    "label": "Publication History"
                }
            },
            {
                "value": "2021-01-21",
                "order": 2,
                "name": "accepted",
                "label": "Accepted",
                "group": {
                    "name": "publication_history",
                    "label": "Publication History"
                }
            },
            {
                "value": "2021-03-09",
                "order": 3,
                "name": "published",
                "label": "Published",
                "group": {
                    "name": "publication_history",
                    "label": "Publication History"
                }
            }
        ]
    }
}
*/ 