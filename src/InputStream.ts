class InputStream {
    pos: number
    input: string
    constructor (input: string) {
        this.pos = 0
        this.input = input
    }

    next () {
        return this.input.charAt(this.pos++)
    }

    peek () {
        return this.input.charAt(this.pos)
    }

    eof () {
        return this.peek() === ''
    }

    around (pos: number, window: [number, number] = [10, 10]) {
        let start = Math.max(0, pos - window[0])
        let end = Math.min(this.input.length, pos + window[1])
        return this.input.slice(start, end)
    }

    err (msg: string, pos?: number) {
        let p = pos ? pos : this.pos
        throw new Error(`${msg} (char:${p})`)
    }
}

export default InputStream