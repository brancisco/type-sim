import InputStream from './InputStream'
import { Token, TokenStreamOptions } from './types'

class TokenStream {
    input: InputStream
    current: Token | null
    options: TokenStreamOptions

    constructor (input: InputStream, options?: TokenStreamOptions) {
        this.input = input
        this.current = null
        this.options = options ? options : { noPunc: false }
    }

    readWhile(f: (c: string) => boolean) {
        var str = ''
        while (!this.input.eof() && f(this.input.peek()))
            str += this.input.next()
        return str
    }

    isRegularText (char: string) {
        return /[^\[\{]/.test(char)
    }

    readEscaped (end: string) {
        let escaped = false
        let str = ''
        let closed = false
        let position = this.input.pos
        while (!this.input.eof()) {
            let char = this.input.next()
            if (escaped) {
                str += char
                escaped = false
            } else if  (char === "\\") {
                str += char
                escaped = true
            } else if (char === end) {
                str += char
                closed = true
                break
            } else {
                str += char
            }
        }
        if (!closed) this.input.err(`Expected closing "${end}" near "${this.input.around(position)}": `, position)
        return str
    }

    readRegularText (): Token {
        let escaped = false
        let str = ''
        while (!this.input.eof()) {
            let char = this.input.peek()
            if (escaped) {
                str += this.input.next()
                escaped = false
            } else if  (char === "\\") {
                str += this.input.next()
                escaped = true
            } else if (!/[^\[\{]/.test(char)) {
                break
            } else {
                str += this.input.next()
            }
        }
        return { type: 'text', value: str }
    }

    isList (char: string) {
        return char === '['
    }

    readList (): Token {
        return { type: 'list', value: this.readEscaped(']') }
    }

    isOptions (char: string) {
        return char === '{'
    }

    readOptions (): Token {
        let position = this.input.pos
        let inString = false
        let escaped = false
        let openCount = 0
        let closeCount = 0
        let result = { type: 'options', value: this.readWhile(c => {
            if (!inString && /\'|\"/.test(c)) inString = true
            else if (inString && !escaped && /\'|\"/.test(c)) inString = false
            else if (inString && c === '\\') escaped = true
            else if (inString && escaped) escaped = false
            else if (!inString && c === '{') openCount ++
            else if (!inString && c === '}') closeCount ++
            return openCount !== closeCount
        }) + this.input.next() }
        if (openCount !== closeCount) this.input.err('Expected closing brace for options:', position)
        return result
    } 

    isPunc (char: string) {
        return [','].includes(char)
    }

    isString (char: string) {
        return ['"', "'"].includes(char)
    }

    readNext (): Token | null  {
        if (this.input.eof()) return null
        if (this.options.noWhiteSpace) this.readWhile(c => c === ' ')
        const char = this.input.peek()
        if (!this.options.noPunc && this.isPunc(char)) return { type: 'punc', value: this.input.next() }
        if (this.isString(char)) return { type: 'string', value: this.input.next() + this.readEscaped(char) }
        if (this.isRegularText(char)) return this.readRegularText()
        if (this.isList(char)) return this.readList()
        if (this.isOptions(char)) return this.readOptions()
        this.input.err(`Can't handle character: ~${char}~`)
        return null
    }

    next () {
        let token = this.current
        this.current = null
        return token || this.readNext()
    }

    peek () {
        return this.current || (this.current = (this.readNext() as Token))
    }

    eof () {
        return this.peek() === null
    }
}

export default TokenStream