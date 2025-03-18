import { Notice } from 'obsidian';
import ObA from './main';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

/*
    Use CrossRef API to download papers metadata
*/
export class CrossRef {

    constructor(private oba: ObA) {
        console.log("CrossRef:constructor");

        // MARK: Commands
        this.oba.addCommand({
            id: "CrossRef-dev",
            name: "CrossRef dev",
            callback: async () => {
                console.clear();
                const sel = this.oba.tools.getSelectedText();
                console.log(sel);
                const data = await this.getCrossrefData(sel);
                console.log(data);
            },
        });

        this.oba.addCommand({
            id: 'oba-crossref-fetch-all',
            name: 'Crossref fetch all bibtex',
            callback: async () => {
                console.clear();
                await this.downloadAll()
            }
        });
    }

    // MARK: extract
    extractReferencesData(cr_data: any) {
        return cr_data?.['message']?.['reference']
    }
    extractReferenceData(cr_data: any, i: number) {
        return cr_data?.['message']?.['reference']?.[i]
    }
    extractReferenceDoi(cr_data: any, i: number) {
        const ref = this.extractReferenceData(cr_data, i);
        const doi = this.oba.tools.getFirst(ref, 
            ["DOI", "doi", "Doi"]
        )
        return this.oba.tools.formatDoi(doi);
    }
    extractReferencesDoi(cr_data: any) {
        const dois: string[] = [];
        const refs = this.extractReferencesData(cr_data);
        for (const ref of refs) {
            const doi0 = this.extractDoi(ref);
            const doi = this.oba.tools.formatDoi(doi0);
            dois.push(doi);
        }
        return dois;
    }
    
    extractDoi(cr_data: any) {
        const doi = this.oba.tools.getFirst(cr_data, 
            ["DOI", "doi", "Doi"]
        )
        return this.oba.tools.formatDoi(doi);
    }

    // MARK: data
    async getCrossrefData(doi: string) {
        let cr_data;
        cr_data = this._loadCrossrefCache(doi);
        if (cr_data) {
            console.log('cache found!')
        } else {
            console.log('cache missed. fetching!')
            cr_data = await this._fetchCrossrefData(doi)
            // store in cache
            if (cr_data) { this.writeCache(doi, cr_data); } 
        }
        return cr_data
    }

    async getReferencesData(doi: string) {
        const cr_data = await this.getCrossrefData(doi);
        return this.extractReferencesData(cr_data)
    }
    
    async getReferencesDoi(doi: string) {
        const cr_data = await this.getCrossrefData(doi);
        return this.extractReferencesDoi(cr_data);
    }

    // MARK: load
    _loadCrossrefCache(doi: string) {
        return this.oba.tools.loadJSON(this.getCachePath(doi));
    }

    async _fetchCrossrefData(doi: string) {
        try {
            new Notice('Sending request');
            const url = `https://api.crossref.org/works/${doi}`;
            const response = await fetch(url);
            console.log('_fetchCrossrefData.response ', response)
            if (!response?.['ok']) {
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

    // MARK: utils
    async downloadAll() {
        const lb_entries = await this.oba.localbibs.getLocalBib();
        console.log("lb_entries");
        console.log(lb_entries);
        for (const lb_entry of lb_entries) {
            console.log("lb_entry");
            console.log(lb_entry);
            const doi = this.oba.localbibs.extractDoi(lb_entry)
            const cr_data = await this.getCrossrefData(doi);
            console.log("cr_data");
            console.log(cr_data);
            this.oba.tools.sleep(100);
        }
    }

    writeCache(url: string, cr_data: any) {
        const path = this.getCachePath(url);
        return this.oba.tools.writeJSON(path, cr_data);
    }

    hasCache(doi: string) {
        const path = this.getCachePath(doi)
        return existsSync(path)
    }

    getCachePath(doi: string): string {
        return join(
            this.getCrossrefDir(),
            this.oba.tools.uriToFilename(doi)
        )
    }


    getCrossrefDir(): string {
        const obaDir = this.oba.tools.getObaDir();
        const _dir = join(obaDir, "crossref");
        if (!existsSync(_dir)) {
            mkdirSync(_dir, { recursive: true });
        }
        return _dir;
    }
}

/*
// MARK: Example
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