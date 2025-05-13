export enum TokenType {
  Number = 0,
  Identifier = 1,
  Operator = 2,
  LParen = 3,
  RParen = 4,
  Colon = 5,
  Comma = 6,
  EOF = 7,
}

export interface Token {
  type: TokenType;
  text: string;
}

export function lex(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < input.length) {
    const c = input[i];
    if (/\s/.test(c)) {
      i++;
      continue;
    }

    // Number (integer or decimal)
    if (/\d/.test(c)) {
      let num = c;
      i++;
      while (i < input.length && /[\d.]/.test(input[i])) {
        num += input[i++];
      }
      tokens.push({ type: TokenType.Number, text: num });
      continue;
    }

    // Identifier (columns A–Z+ lowercase rows a–z)
    if (/[A-Za-z]/.test(c)) {
      let id = c;
      i++;
      while (i < input.length && /[A-Za-z]/.test(input[i])) {
        id += input[i++];
      }
      tokens.push({ type: TokenType.Identifier, text: id });
      continue;
    }

    // Single-character tokens
    switch (c) {
      case "+":
      case "-":
      case "*":
      case "/":
        tokens.push({ type: TokenType.Operator, text: c });
        i++;
        break;
      case "(":
        tokens.push({ type: TokenType.LParen, text: c });
        i++;
        break;
      case ")":
        tokens.push({ type: TokenType.RParen, text: c });
        i++;
        break;
      case ":":
        tokens.push({ type: TokenType.Colon, text: c });
        i++;
        break;
      case ",":
        tokens.push({ type: TokenType.Comma, text: c });
        i++;
        break;
      default:
        throw new Error(`Unexpected character: '${c}'`);
    }
  }

  tokens.push({ type: TokenType.EOF, text: "" });
  return tokens;
}
