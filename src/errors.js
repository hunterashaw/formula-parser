export class ParseError extends Error {
    constructor(message, tokens) {
        super(message)
        this.tokens = tokens
    }
}

export class EvaluationError extends Error {
    constructor(message, index) {
        super(message)
        this.index = index
    }
}