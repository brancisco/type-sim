# Javascript Typing Simulator

Use it to create simulated typing for the command line, web interfaces, or anywhere else you use Javascript.

**NOTE:**
Works if syntax is correct, but doesn't pick up all syntax errors in the little type-sim "language." I would need to write some tests, and work out any kinks before publishing as npm package.

## Example

Using type-sim in the terminal:

```js
const stringToSimulate = `\
Welcome to the ["repository", "typing simulator"] repository. This was a \
["time consuming.. :)", "fun"] project to build!`

let mysim = new TypingSim(str5, { profile: 'fast' })

mysim.displayCallback = (text) => {
    process.stdout.write(text.padEnd(process.stdout.columns) + '\r')
}

mysim.run()
    .then(() => {
        process.stdout.write(''.padEnd(process.stdout.columns) + '\r')
    })
```

Output:

![Example GIF](./meta/img/example.gif)

## How it works

I wrote a little parser.

It takes your string and converts it into a set of instructions on how to type out the string.

Some examples of strings it could parse.

```js
let string = "this is just regular text."
let string2 = "this is NOT just ['cool', 'awesome stuff', 'text']."
let string3 = "['Hello', 'Hey', 'Hi']{ start_delete_delay: 0, start_typing_delay: 0 } what \
is your name?"
```

## TODO

- [ ] write a little BNF grammar to show what the littler type-sim language can do.
- [ ] throw errors when syntax is incorrect
- [ ] write some dang tests