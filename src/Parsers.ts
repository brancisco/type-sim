import InputStream from './InputStream'
import TokenStream from './TokenStream'
import { Token, TokenStreamOptions } from './types'

const parseList = function (list: string): Token {
    const input = new InputStream(list.slice(1,-1))
    const tokstream = new TokenStream(input, { noWhiteSpace: true })
    const items = []
    let cur, last
    while (!tokstream.eof()) {
        cur = tokstream.next()
        if (cur === null) break

        if (!['text', 'string', 'punc'].includes(cur.type)) {
            throw new Error('list can only contain string & comma')
        }
        if ('text' === cur.type) {
            items.push(cur.value)
        } else if ('string' === cur.type) {
            items.push((cur.value as string).slice(1, -1))
        } else if ('punc' === cur.type) {
            if (!last) {
                items.push('')
            } else if (tokstream.peek() === null) {
                items.push('')
            }
        }
        last = cur
    }
    return { type: 'list', value: items }
}

const parseOptions = function (options: string): Token {
    return { type: 'options', value: eval(`(() => { return ${options} })()`) }
}

const parseInstructions = function (tok: Token, stream: TokenStream): Token {
    const next = stream.peek()
    let operand
    if (tok.type === 'text') operand = { type: 'text', value: tok.value }
    else if (tok.type === 'list') operand = parseList(tok.value as string)
    else throw new Error('parseOptions: Cannot handle token of type "' + tok.type + '"')

    return {
        type: 'instruction',
        value: {
            operand,
            options: next && next.type === 'options' ?
                parseOptions((((stream.next() as Token).value) as string)).value :
                'default'
        }
    }
}

export const strEval = function (str: string): Array<Token> {
    const tokstream = new TokenStream(new InputStream(str), { noPunc: true })

    const chain = []
    while(!tokstream.eof()) {
        const token = tokstream.next()
        chain.push(parseInstructions((token as Token), tokstream))
    }
    return chain
}