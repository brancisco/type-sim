export interface Token {
    type: string,
    value: string | Array<string> | object
}

export interface TokenStreamOptions {
    noPunc?: boolean,
    noWhiteSpace?: boolean
}