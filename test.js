const InputStream = require('./lib/InputStream.js').default
const TokenStream = require('./lib/TokenStream.js').default
const TypingSim = require('./lib/TypingSimulator.js').default

const str1 = `Hello, [my]{ id: 'elli}pse'} name is\n ['Bra"ndon',"George",][...]{ id: 'ellipse' }, well i used to go by brandon[]{ delay: 1000 }, but now I just go by [George]{ charDelay: 200 } but if you insist okay thats it`
const str2 = '["hey there","hello there"]{ start_typing_delay: 1 }. Having fun?'
const str3 = `\
["Hello", "Hey", "Hi"]{ start_delete_delay: 0, start_typing_delay: 0 }[" there!"]{ start_typing_delay: 0, start_delete_delay: 1000 } \
My name is { start_typing_delay: 0, start_delete_delay: 0 }["Brandon", "George"]{ start_delete_delay: 0, start_typing_delay: 0 }[.] \
What is yours?\
`
const str4 = `\
Welcome to the { start_delete_delay: 0 }\
["repository", "typing simulator"]{ start_typing_delay: 0, start_delete_delay: 100 } \
repository.{ start_typing_delay: 0 } \
This was a { start_delete_delay: 0 }\
["time consuming", "fun"]{ start_typing_delay: 0, start_delete_delay: 0 } \
project to build! \
`
const str5 = `\
Welcome to the ["repository", "typing simulator"] repository. This was a \
["time consuming.. :)", "fun"] project to build!
`

let mysim = new TypingSim(str5, { profile: 'fast' })
// console.log(JSON.stringify(mysim.instructions))
mysim.displayCallback = (text) => {
    process.stdout.write(text.padEnd(process.stdout.columns) + '\r')
}

mysim.run().then(() => {
    process.stdout.write(''.padEnd(process.stdout.columns) + '\r')
})