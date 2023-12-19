import split from './split.js'
import group from './group.js'
import evaluate from './evaluate.js'
import { EvaluationError } from './errors.js'

export { evaluate }

/**
 * @param {string} expression 
 */
export default function parse(text) {
    try {
        const tokens = split(text)
        const expression = group(tokens)
        return {
            text,
            tokens,
            expression,
            evaluate: (context = {}, functions = {}) => evaluate(expression, context, functions)
        }
    }
    catch (e) {
        return {
            error: e.message,
            text,
            tokens: e?.tokens,
            expression,
            evaluate: () => {
                throw new EvaluationError(e.message)
            }
        }
    }
}