const util = require("util");
// tokenizer
// single character
const tokenizeCharacter = (type, value, input, index) =>
  value === input[index] ? [1, { type, value }] : [0, null];

const tokenizeParenOpen = (input, index) =>
  tokenizeCharacter("paren", "(", input, index);

const tokenizeParenClose = (input, index) =>
  tokenizeCharacter("paren", ")", input, index);

// multi character
const tokenizePattern = (type, pattern, input, current) => {
  let char = input[current];
  let consumedChars = 0;
  if (pattern.test(char)) {
    let value = "";
    while (char && pattern.test(char)) {
      value += char;
      consumedChars++;
      char = input[current + consumedChars];
    }
    return [consumedChars, { type, value }];
  }
  return [0, null];
};

const tokenizeNumber = (input, index) =>
  tokenizePattern("number", /\d/, input, index);

const tokenizeName = (input, index) =>
  tokenizePattern("name", /[A-Za-z_]/, input, index);

const tokenizeWhitespace = (input, index) =>
  /\s/.test(input[index]) ? [1, null] : [0, null];

// value 里忽略双引号
const tokenizeString = (input, index) => {
  if (input[index] === '"') {
    let value = "";
    let consumedChars = 1;
    let char = input[index + consumedChars];
    while (char !== '"') {
      if (char == undefined) {
        throw new TypeError("unterminated string");
      }
      value += char;
      consumedChars++;
      char = input[index + consumedChars];
    }
    return [consumedChars + 1, { type: "string", value }];
  }
  return [0, null];
};

const tokenizers = [
  tokenizeParenOpen,
  tokenizeParenClose,
  tokenizeNumber,
  tokenizeName,
  tokenizeString,
  tokenizeWhitespace,
];

const tokenizer = (input) => {
  let index = 0;
  const tokens = [];

  while (index < input.length) {
    let tokenFound = false;

    for (const tokenizer of tokenizers) {
      const [consumedChars, token] = tokenizer(input, index);
      if (consumedChars === 0) continue;
      index += consumedChars;
      if (token) tokens.push(token);
      tokenFound = true;
      break;
    }

    if (!tokenFound) {
      throw new TypeError(
        "I don't know what this character is: " + input[index]
      );
    }
  }

  return tokens;
};

// console.log(tokenizeNumber("123ab456", 0));
// console.log(tokenizeName("_hello world", 0));
// console.log(tokenizeString('"hello world"', 0));
// console.log(tokenizer('(add 2 (subtract "314" 2))'));

// parser
const parseNumber = (tokens, index) => [
  index + 1,
  { type: "NumberLiteral", value: tokens[index].value },
];

const parseString = (tokens, index) => [
  index + 1,
  {
    type: "StringLiteral",
    value: tokens[index].value,
  },
];

const parseExpression = (tokens, index) => {
  let token = tokens[++index];
  let node = {
    type: "CallExpression",
    name: token.value,
    params: [],
  };
  token = tokens[++index];
  while (!(token.type == "paren" && token.value == ")")) {
    const [_index, param] = parseToken(tokens, index);
    index = _index;
    node.params.push(param);
    token = tokens[_index];
  }
  index++;
  return [index, node];
};

const parseToken = (tokens, index) => {
  const token = tokens[index];
  if (token.type === "number") {
    return parseNumber(tokens, index);
  } else if (token.type === "string") {
    return parseString(tokens, index);
  } else if (token.type === "paren" && token.value === "(") {
    return parseExpression(tokens, index);
  } else {
    throw new TypeError("I don't know what this token is: " + token.type);
  }
};

const parseProgram = (tokens) => {
  let index = 0;
  let ast = {
    type: "Program",
    body: [],
  };

  while (index < tokens.length) {
    const [newIndex, node] = parseToken(tokens, index);
    index = newIndex;
    ast.body.push(node);
  }

  return ast;
};

// test parseExpression
// const tokens = tokenizer('(add 2 (subtract 4 2)) "Hello!"');
// console.log(tokens);
// const [index, node] = parseToken(tokens, 0);
// console.log(index, node);
// test parseProgram
// const tokens2 = [
//   { type: "paren", value: "(" },
//   { type: "name", value: "print" },
//   { type: "string", value: "Hello" },
//   { type: "number", value: "2" },
//   { type: "paren", value: ")" },
//   { type: "paren", value: "(" },
//   { type: "name", value: "add" },
//   { type: "number", value: "2" },
//   { type: "paren", value: "(" },
//   { type: "name", value: "subtract" },
//   { type: "number", value: "4" },
//   { type: "number", value: "2" },
//   { type: "paren", value: ")" },
//   { type: "paren", value: ")" },
// ];
// console.log(util.inspect(parseProgram(tokens2), { depth: null }));
