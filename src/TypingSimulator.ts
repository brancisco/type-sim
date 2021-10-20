import { strEval } from './Parsers'
import { Token, TokenStreamOptions } from './types'

interface Instruction {
    type: string
    value: {
        operand: { type: string, value: string | Array<string> },
        options: string | object
    }
}

interface TypeSimOptions {
    profile: string
    start_typing_delay: number | [number, number]
    typing_delay: number | [number, number]
    start_delete_delay: number | [number, number]
    delete_delay: number | [number, number]
    delete_stutter_count: number | [number, number]
    delete_stutter_delay: number | [number, number]
    repeat: boolean
}

interface TypeSimOptionsByUser {
    profile?: string
    start_typing_delay?: number | [number, number]
    typing_delay?: number | [number, number]
    start_delete_delay?: number | [number, number]
    delete_delay?: number | [number, number]
    delete_stutter_count?: number | [number, number]
    delete_stutter_delay?: number | [number, number]
    noDelete?: boolean
    repeat?: boolean
}

const profiles: { [key: string]: object } = {
    slow: {
        start_typing_delay: [500, 700],
        typing_delay: [100, 200],
        start_delete_delay: [500, 700],
        delete_delay: 80,
        delete_stutter_count: 5,
        delete_stutter_delay: [200, 250]
    },
    normal: {
        start_typing_delay: [400, 600],
        typing_delay: [50, 200],
        start_delete_delay: [400, 600],
        delete_delay: 60,
        delete_stutter_count: 4,
        delete_stutter_delay: [150, 250]
    },
    fast: {
        start_typing_delay: [300, 500],
        typing_delay: [40, 100],
        start_delete_delay: [300, 500],
        delete_delay: 40,
        delete_stutter_count: 3,
        delete_stutter_delay: [100, 200]
    }
}

class TypingSimulator {
    instructions: Array<Instruction>
    options: TypeSimOptionsByUser
    index: number
    display: string
    // texts: Array<string>
    displayCallback?: (display: string) => void | undefined
    finishedCallback?: () => void | undefined

    constructor (instructions: string, options?: TypeSimOptionsByUser) {
        this.instructions = (strEval(instructions) as Array<Instruction>)
        this.options = this.mergeOptions(options)
        this.display = ''
        this.index = 0
    }

    mergeOptions (options?: TypeSimOptionsByUser): TypeSimOptions {
        let profile
        if (options && options.profile) profile = options.profile
        else if (this.options && this.options.profile) profile = this.options.profile
        else profile = 'normal'
        return {
            // is false always
            repeat: false,
            // merge in the over all options
            ...this.options,
            // merge in the current profile options
            ...profiles[profile],
            // merge in the type of profile
            profile,
            // merge in any extra current options 
            ...(options ? options : {})
        } as TypeSimOptions
    }

    private getRandomNumInRange (range: number | [number, number]): number {
        if (Array.isArray(range)) {
            return Math.floor(range[0] + Math.random()*(Math.abs(range[1] - range[0])))
        } else return range
    }

    inferOptions (texts: Array<string>, options?: TypeSimOptionsByUser | string): TypeSimOptions {
        let defaults = { noDelete: this.options && this.options.noDelete ? this.options.noDelete : true }
        if (options === undefined) return this.mergeOptions()
        else if (options === 'default' && texts.length > 1) return this.mergeOptions()
        else if (options === 'default' && texts.length === 1) return this.mergeOptions(defaults)
        else if (texts.length > 1) return this.mergeOptions(options as object)
        else if (texts.length === 1) return this.mergeOptions({
            ...defaults,
            ...options as object
        })
        return this.mergeOptions()
    }

    getAnimationFunctions (ithInstruction: number): () => Promise<string> {
        let instruction = this.instructions[ithInstruction].value
        const texts = Array.isArray(instruction.operand.value) ? instruction.operand.value : [instruction.operand.value]
        const options = this.inferOptions(texts, instruction.options)
        let displayText = ''
        let currentState = 0
        let index = 0
        const cycle = () => { index = (index + 1) % texts.length }

        const stateTransitions = [
            'typing',
            'finish_typing_wait',
            'delete_stutter',
            'delete_steady',
            'start_typing_wait'
        ]

        const callNext = (): Promise<string> => {
            if (this.displayCallback) this.displayCallback(this.display + displayText);
            return stateFunctions[stateTransitions[currentState]]()
        }

        var stateFunctions: { [key: string]: () => Promise<string>} = {
            typing: () => {
                return new Promise(r => setTimeout(() => {
                    displayText += texts[index][displayText.length]
                    if (displayText.length === texts[index].length) currentState ++
                    r(callNext())
                }, this.getRandomNumInRange(options.typing_delay)))
            },
            finish_typing_wait: () => {
                return new Promise(r => setTimeout(() => {
                    currentState ++
                    if (index < texts.length - 1 || options.repeat) r(callNext())
                    else r(displayText)
                }, this.getRandomNumInRange(options.start_delete_delay)))
            },
            delete_stutter: () => {
                const stutterCount = this.getRandomNumInRange(options.delete_stutter_count)
                return new Promise(r => setTimeout(() => {
                    displayText = displayText.slice(0, displayText.length - 1)
                    if (displayText.length < 1 || texts[index].length - displayText.length >= stutterCount)
                        currentState ++
                    r(callNext())
                }, this.getRandomNumInRange(options.delete_stutter_delay)))
            },
            delete_steady: () => {
                return new Promise(r => setTimeout(() => {
                    displayText = displayText.slice(0, displayText.length - 1)
                    if (displayText.length < 1) currentState ++
                    r(callNext())
                }, this.getRandomNumInRange(options.delete_delay)))
            },
            start_typing_wait: () => {
                return new Promise(r => setTimeout(() => {
                    currentState = 0
                    cycle()
                    r(callNext())
                }, this.getRandomNumInRange(options.start_typing_delay)))
            }
        }
        return callNext
    }

    run (): Promise<void> {
        const run = (): any => {
            return this.getAnimationFunctions(this.index)().then(result => {
                this.display += result
                if (this.index < this.instructions.length - 1) {
                    this.index ++
                    return run()
                }
                return new Promise((r) => r())
            })
        }
        return run()
    }
}

export default TypingSimulator