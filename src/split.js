import { ParseError } from "./errors.js"

export default function split(expression) {
    const operators = [
        '(',
        ')',
        ':',
        ',',
        '+',
        '-',
        '*',
        '/',
        '%',
        '=',
        '!',
        '<',
        '>',
        '&',
        '|'
    ]
    const quote = '"'
    const result = []

    let start = 0
    let in_quote = false
    const add = i => {
        let value = expression.slice(start, i)

        if (in_quote) result.push({ value, type: 'text', start: start - 1 })
        else {
            value = value.trim()
            if (value.length) {
                if (!isNaN(value))
                    result.push({
                        value: parseFloat(value),
                        type: 'number',
                        start
                    })
                else if (value.toLowerCase() === 'true')
                    result.push({ value: true, type: 'boolean', start })
                else if (value.toLowerCase() === 'false')
                    result.push({ value: false, type: 'boolean', start })
                else result.push({ value, type: 'reference', start })
            }
        }

        start = i + 1
    }

    for (let i = 0; i < expression.length; i++) {
        const c = expression[i]
        const last = () => expression[i - 1]
        const next = () => expression[i + 1]
        const test_quote = () => c === quote && last() !== '\\'

        if (in_quote) {
            if (test_quote()) {
                add(i)
                in_quote = false
                continue
            }
        }

        if (test_quote()) {
            add(i)
            in_quote = true
            continue
        }

        if (operators.includes(c)) {
            add(i)
            const type = 'operator'
            if (['<', '>', '!'].includes(c) && next() === '=') {
                start++
                i++
                result.push({ value: c + '=', type, start: i - 1 })
                continue
            }
            result.push({ value: c, type, start: i })
        }
    }
    if (in_quote) throw new ParseError('Expression ends in unclosed quote.', result)
    add()

    return result
}