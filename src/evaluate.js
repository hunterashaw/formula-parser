import { EvaluationError } from "./errors.js"

export default function evaluate(expression, context, functions) {
    const get = token => {
        if (!token) return
        if (token.type === 'operator') return token
        if (Array.isArray(token)) return evaluate(token, context, functions)
        if (token.type === 'reference')
            return context[token.value]
        if (token.type === 'function') {
            if (!functions[token.value]?.call)
                throw new EvaluationError(
                    `Function "${token.value}" not implemented.`, token.start
                )
            const function_arguments = evaluate(token.arguments, context, functions) ?? []
            return functions[token.value]?.call(
                context,
                ...(evaluate(token.arguments, context, functions) ?? [])
            )
        }
        return token.value
    }

    let current = get(expression[0])

    if (current?.type === 'operator')
        throw new EvaluationError('Expression cannot start with an operator.', 0)

    for (let i = 1; i < expression.length; i += 2) {
        const b = get(expression[i])
        const c = get(expression[i + 1])

        if (b?.type !== 'operator')
            throw new EvaluationError(
                `Expression cannot contain 2 consecutive values.`, b?.start
            )
        if (c?.type === 'operator')
            throw new Error(
                `Expression cannot contain 2 consecutive operators.`, c?.start
            )

        switch (b.value) {
            case '+':
                current += c
                continue
            case '-':
                current -= c
                continue
            case '*':
                current *= c
                continue
            case '/':
                current /= c
                continue
            case '%':
                current %= c
                continue
            case ':':
                current = {
                    [current]: c
                }
                continue
            case ',':
                if (typeof current === 'object') {
                    if (Array.isArray(current)) current = [...current, c]
                    else {
                        i+=2
                        if (i >= expression.length)
                            throw new EvaluationError('Expression contains unclosed object.', c?.start)

                        const d = get(expression[i])
                        const e = get(expression[i + 1])
                        if (d.type !== 'operator' && d.value !== ':')
                            throw new EvaluationError('Expression object must follow key:value format.', d?.start)
                        if (e.type === 'operator')
                            throw new EvaluationError('Expression object must follow key:value format.', e?.start)

                        current = {
                            ...current,
                            [c]: e
                        }
                    }
                }
                
                else current = [current, c]
                continue
            case '=':
                current = current == c
                continue
            case '!=':
                current = current != c
                continue
            case '<':
                current = current < c
                continue
            case '<=':
                current = current <= c
                continue
            case '>':
                current = current > c
                continue
            case '>=':
                current = current >= c
                continue
            case '&':
                current = current && c
                continue
            case '|':
                current = current || c
                continue
        }
        throw new EvaluationError(`Operator "${b.value}" not implemented.`, b?.start)
    }

    return current
}