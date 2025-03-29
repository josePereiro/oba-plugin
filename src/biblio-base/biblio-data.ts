/*
    This is the all in one representation of bibliography data...
    All services producing/working bibliography data must yield to it...
    That is, any comunication of bibliography data accross services must be 
    using this interface...
    Any special object must be internal and not used outside a particular service...
*/
import { TFile } from "obsidian"

 

// MARK: interfaces
/*
    A bundle of unique BiblIO fields
*/ 
export interface BiblIOIder {
    "doi"?: string | null, 
    "citekey"?: string | null,
    "citnote"?: TFile | string | null,
    "query"?: string, // to trigger search
}

export interface RefBiblIOIderMap {
    [key: string]: BiblIOIder
}

export interface BiblIOAuthor {
    "firstName": string | null,
    "lastName": string | null,
    "ORCID": string | null,
    "affiliations": string[] | null,
}
export interface BiblIODate {
    "year": number | null,
    "month": number | null,
    "day": number | null,
}

export interface BiblIOData {
    "doi": string| null,
    "citekey": string | null,
    "type": string | null,
    "title": string | null,
    "authors": BiblIOAuthor[] | null,
    "created-date": BiblIODate | null,
    "deposited-date": BiblIODate | null,
    "issued-date": BiblIODate | null,
    "published-date": BiblIODate | null,
    "journaltitle": string | null,
    "url": string | null,
    "abstract": string | null,
    "keywords": string[] | null,
    "references-count": number | null,
    "references-map": RefBiblIOIderMap | null,
    "extras": any | null,
}
