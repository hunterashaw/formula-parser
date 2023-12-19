// src/errors.js
var ParseError = class extends Error {
  constructor(message, tokens) {
    super(message);
    this.tokens = tokens;
  }
};
var EvaluationError2 = class extends Error {
  constructor(message, index) {
    super(message);
    this.index = index;
  }
};

// src/split.js
function split(expression2) {
  const operators = [
    "(",
    ")",
    ":",
    ",",
    "+",
    "-",
    "*",
    "/",
    "%",
    "=",
    "<",
    ">",
    "&",
    "|"
  ];
  const quote = '"';
  const result = [];
  let start = 0;
  let in_quote = false;
  const add = (i) => {
    let value = expression2.slice(start, i);
    if (in_quote)
      result.push({ value, type: "text", start: start - 1 });
    else {
      value = value.trim();
      if (value.length) {
        if (!isNaN(value))
          result.push({
            value: parseFloat(value),
            type: "number",
            start
          });
        else if (value.toLowerCase() === "true")
          result.push({ value: true, type: "boolean", start });
        else if (value.toLowerCase() === "false")
          result.push({ value: false, type: "boolean", start });
        else
          result.push({ value, type: "reference", start });
      }
    }
    start = i + 1;
  };
  for (let i = 0; i < expression2.length; i++) {
    const c = expression2[i];
    const last = () => expression2[i - 1];
    const next = () => expression2[i + 1];
    const test_quote = () => c === quote && last() !== "\\";
    if (in_quote) {
      if (test_quote()) {
        add(i);
        in_quote = false;
        continue;
      }
    }
    if (test_quote()) {
      add(i);
      in_quote = true;
      continue;
    }
    if (operators.includes(c)) {
      add(i);
      const type = "operator";
      if (["<", ">", "!"].includes(c) && next() === "=") {
        start++;
        i++;
        result.push({ value: c + "=", type, start: i - 1 });
        continue;
      }
      result.push({ value: c, type, start: i });
    }
  }
  if (in_quote)
    throw new ParseError("Expression ends in unclosed quote.", result);
  add();
  return result;
}

// src/group.js
function group(tokens) {
  const result = [];
  const stack = [];
  let current = result;
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token.value === "(" && token.type === "operator") {
      stack.push(current);
      current = [];
      continue;
    }
    if (token.value === ")" && token.type === "operator") {
      const parent = stack.pop();
      if (parent[parent.length - 1]?.type === "reference") {
        parent[parent.length - 1].type = "function";
        parent[parent.length - 1].arguments = current;
      } else
        parent.push(current);
      current = parent;
      continue;
    } else
      current.push(token);
  }
  if (stack.length)
    throw new ParseError(`Expression ends in unclosed parenthesis.`, result);
  return result;
}

// src/evaluate.js
function evaluate(expression2, context, functions) {
  const get = (token) => {
    if (!token)
      return;
    if (token.type === "operator")
      return token;
    if (Array.isArray(token))
      return evaluate(token, context);
    if (token.type === "reference")
      return context[token.value] ?? functions[token.value];
    if (token.type === "function") {
      if (!functions[token.value]?.call)
        throw new EvaluationError2(
          `Function "${token.value}" not implemented.`,
          token.start
        );
      return functions[token.value]?.call(
        context,
        evaluate(token.arguments)
      );
    }
    return token.value;
  };
  let current = get(expression2[0]);
  if (current?.type === "operator")
    throw new EvaluationError2("Expression cannot start with an operator.", 0);
  for (let i = 1; i < expression2.length; i += 2) {
    const b = get(expression2[i]);
    const c = get(expression2[i + 1]);
    if (b?.type !== "operator")
      throw new EvaluationError2(
        `Expression cannot contain 2 consecutive values.`,
        b.start
      );
    if (c?.type === "operator")
      throw new Error(
        `Expression cannot contain 2 consecutive operators.`,
        c.start
      );
    switch (b.value) {
      case "+":
        current += c;
        continue;
      case "-":
        current -= c;
        continue;
      case "*":
        current *= c;
        continue;
      case "/":
        current /= c;
        continue;
      case "%":
        current %= c;
        continue;
      case ":":
        current = {
          [current]: c
        };
        continue;
      case ",":
        if (typeof current === "object") {
          if (Array.isArray(current))
            current = [...current, c];
          else {
            i += 2;
            if (i >= expression2.length)
              throw new EvaluationError2("Expression contains unclosed object.", c.start);
            const d = get(expression2[i]);
            const e = get(expression2[i + 1]);
            if (d.type !== "operator" && d.value !== ":")
              throw new EvaluationError2("Expression object must follow key:value format.", d.start);
            if (e.type === "operator")
              throw new EvaluationError2("Expression object must follow key:value format.", e.start);
            current = {
              ...current,
              [c]: e
            };
          }
        } else
          current = [current, c];
        continue;
      case "=":
        current = current == c;
        continue;
      case "!=":
        current = current != c;
        continue;
      case "<":
        current = current < c;
        continue;
      case "<=":
        current = current <= c;
        continue;
      case ">":
        current = current > c;
        continue;
      case ">=":
        current = current >= c;
        continue;
      case "&":
        current = current && c;
        continue;
      case "|":
        current = current || c;
        continue;
    }
    throw new EvaluationError2(`Operator "${b.value}" not implemented.`, b.start);
  }
  return current;
}

// src/index.js
function parse(text) {
  try {
    const tokens = split(text);
    const expression2 = group(tokens);
    return {
      text,
      tokens,
      expression: expression2,
      evaluate: (context = {}, functions = {}) => evaluate(expression2, context, functions)
    };
  } catch (e) {
    return {
      error: e.message,
      text,
      tokens: e?.tokens,
      expression,
      evaluate: () => {
        throw new EvaluationError(e.message);
      }
    };
  }
}
export {
  parse as default,
  evaluate
};
