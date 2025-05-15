import { type Token, TokenType, lex } from "./lexer";

const PRECEDENCE: Record<string, number> = {
  "+": 10,
  "-": 10,
  "*": 20,
  "/": 20,
};

export type ASTNode =
  | { type: "number"; value: number }
  | { type: "cell"; id: string; sheet?: string }
  | { type: "range"; start: string; end: string; sheet?: string }
  | { type: "binary"; op: string; left: ASTNode; right: ASTNode }
  | { type: "func"; name: string; args: ASTNode[] };

export class Parser {
  private tokens: Token[];
  private pos = 0;

  constructor(input: string) {
    this.tokens = lex(input);
  }

  private peek(): Token {
    return this.tokens[this.pos];
  }

  private next(): Token {
    return this.tokens[this.pos++];
  }

  // Pratt entry point
  public parseExpression(rbp = 0): ASTNode {
    let t = this.next();
    let left = this.nud(t);

    while (rbp < this.lbp(this.peek())) {
      t = this.next();
      left = this.led(t, left);
    }

    return left;
  }

  private nud(token: Token): ASTNode {
    switch (token.type) {
      case TokenType.Number:
        return { type: "number", value: Number.parseFloat(token.text) };
      case TokenType.Identifier: {
        // sheet reference? look for '!'
        if (this.peek().type === TokenType.Bang) {
          const sheetName = token.text;
          this.next(); // consume '!'
          const nextTok = this.next();
          if (nextTok.type !== TokenType.Identifier)
            throw new Error(`Expected cell ref after !, got ${nextTok.text}`);
          const cellId = nextTok.text;
          // range?
          if (this.peek().type === TokenType.Colon) {
            this.next(); // consume ':'
            const endTok = this.next();
            if (endTok.type !== TokenType.Identifier)
              throw new Error(`Invalid range end: ${endTok.text}`);
            return {
              type: "range",
              sheet: sheetName,
              start: cellId,
              end: endTok.text,
            };
          }
          return { type: "cell", sheet: sheetName, id: cellId };
        }
        // function call?
        if (this.peek().type === TokenType.LParen) {
          const name = token.text;
          this.next(); // consume '('
          const args: ASTNode[] = [];
          if (this.peek().type !== TokenType.RParen) {
            do {
              args.push(this.parseExpression());
            } while (this.peek().type === TokenType.Comma && this.next());
          }
          this.expect(TokenType.RParen);
          return { type: "func", name, args };
        }
        return { type: "cell", id: token.text };
      }
      case TokenType.LParen: {
        const expr = this.parseExpression();
        this.expect(TokenType.RParen);
        return expr;
      }
      default:
        throw new Error(`Unexpected token in nud: ${token.text}`);
    }
  }

  private led(token: Token, left: ASTNode): ASTNode {
    switch (token.type) {
      case TokenType.Operator: {
        const prec = PRECEDENCE[token.text] || 0;
        const right = this.parseExpression(prec);
        return { type: "binary", op: token.text, left, right };
      }
      case TokenType.Colon: {
        const start =
          left.type === "cell"
            ? left.id
            : (() => {
                throw new Error("Invalid range start");
              })();
        const sheet = left.sheet;
        const endTok = this.next();
        if (endTok.type !== TokenType.Identifier)
          throw new Error(`Invalid range end: ${endTok.text}`);
        return { type: "range", sheet, start, end: endTok.text };
      }
      default:
        throw new Error(`Unexpected token in led: ${token.text}`);
    }
  }

  private lbp(token: Token): number {
    if (token.type === TokenType.Operator) return PRECEDENCE[token.text] || 0;
    if (token.type === TokenType.Colon) return 30;
    return 0;
  }

  private expect(type: TokenType) {
    const tok = this.next();
    if (tok.type !== type)
      throw new Error(`Expected ${TokenType[type]}, got ${tok.text}`);
  }
}
