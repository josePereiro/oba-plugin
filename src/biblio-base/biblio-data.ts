/*
    This is the all in one representation of bibliography data...
    All services producing/working bibliography data must yield to it...
    That is, any comunication of bibliography data accross services must be 
    using this interface...
    Any special object must be internal and not used outside a particular service...
*/ 

// MARK: interfaces
export interface BiblIOAuthor {
    "firstName": string,
    "lastName": string,
    "ORCID": string | null,
    "affiliations": string[] | null,
}
export interface BiblIODate {
    "year": number,
    "month": number | null,
    "day": number | null,
}

export interface BiblIOData {
    
    "doi": string,
    
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
    "references-DOIs": string[] | null,
    "extras": any | null,
}

// MARK: getters
export function getDoi(biblio: BiblIOData) {
    return biblio["doi"]
}
export function getType(biblio: BiblIOData) {
    return biblio["type"]
}
export function getTitle(biblio: BiblIOData) {
    return biblio["title"]
}
export function getAuthors(biblio: BiblIOData) {
    return biblio["authors"]
}
export function getCreatedDate(biblio: BiblIOData) {
    return biblio["created-date"]
}
export function getDepositedDate(biblio: BiblIOData) {
    return biblio["deposited-date"]
}
export function getIssuedDate(biblio: BiblIOData) {
    return biblio["issued-date"]
}
export function getPublishedDate(biblio: BiblIOData) {
    return biblio["published-date"]
}
export function getJournalTitle(biblio: BiblIOData) {
    return biblio["journaltitle"]
}
export function getUrl(biblio: BiblIOData) {
    return biblio["url"]
}
export function getAbstract(biblio: BiblIOData) {
    return biblio["abstract"]
}
export function getKeywords(biblio: BiblIOData) {
    return biblio["keywords"]
}
export function getReferencesCount(biblio: BiblIOData) {
    return biblio["references-count"]
}
export function getReferencesDOIs(biblio: BiblIOData) {
    return biblio["references-DOIs"]
}
export function getExtras(biblio: BiblIOData) {
    return biblio["extras"]
}