import { ParseError } from "./errors.js"

export default function group(tokens) {
    const result = []
    const stack = []
    let current = result

    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i]

        if (token.value === '(' && token.type === 'operator') {
            stack.push(current)
            current = []
            continue
        }
        if (token.value === ')' && token.type === 'operator') {
            const parent = stack.pop()
            if (parent[parent.length - 1]?.type === 'reference') {
                parent[parent.length - 1].type = 'function'
                parent[parent.length - 1].arguments = current
            } else parent.push(current)

            current = parent
            continue
        } else current.push(token)
    }
    if (stack.length) throw new ParseError(`Expression ends in unclosed parenthesis.`, result)

    return result
}