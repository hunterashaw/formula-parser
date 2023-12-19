import parse from "../src/index.js"

const test = `log(
    "name": "thing",
    "type": 10
)`

const parsed = parse(test)

console.log(JSON.stringify(parsed, null, 2))

console.log(parsed.evaluate({}, {log: console.log}))