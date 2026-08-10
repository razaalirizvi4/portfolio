// Hand-rolled recursive-descent arithmetic evaluator.
// Grammar (highest precedence last):
//   expr   := term (('+' | '-') term)*
//   term   := factor (('*' | '/' | '%') factor)*
//   factor := unary ('**' factor)?        // right-associative
//   unary  := ('+' | '-') unary | atom
//   atom   := number | '(' expr ')'
// No eval/Function — a real tokenizer + parser. Throws on invalid input.

type Tok =
  | { t: "num"; v: number }
  | { t: "op"; v: "+" | "-" | "*" | "/" | "%" | "**" }
  | { t: "lp" }
  | { t: "rp" };

function tokenize(src: string): Tok[] {
  const toks: Tok[] = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === " " || c === "\t") { i++; continue; }
    if (c >= "0" && c <= "9" || c === ".") {
      let j = i;
      while (j < src.length && ((src[j] >= "0" && src[j] <= "9") || src[j] === ".")) j++;
      const raw = src.slice(i, j);
      if ((raw.match(/\./g) || []).length > 1) throw new Error("invalid number");
      const v = Number(raw);
      if (Number.isNaN(v)) throw new Error("invalid number");
      toks.push({ t: "num", v });
      i = j;
      continue;
    }
    if (c === "*" && src[i + 1] === "*") { toks.push({ t: "op", v: "**" }); i += 2; continue; }
    if (c === "+" || c === "-" || c === "*" || c === "/" || c === "%") {
      toks.push({ t: "op", v: c });
      i++;
      continue;
    }
    if (c === "(") { toks.push({ t: "lp" }); i++; continue; }
    if (c === ")") { toks.push({ t: "rp" }); i++; continue; }
    throw new Error(`unexpected character: ${c}`);
  }
  return toks;
}

export function evaluate(expr: string): number {
  const toks = tokenize(expr);
  let pos = 0;

  const peek = () => toks[pos];
  const next = () => toks[pos++];

  function parseExpr(): number {
    let left = parseTerm();
    while (peek() && peek().t === "op" && ((peek() as { v: string }).v === "+" || (peek() as { v: string }).v === "-")) {
      const op = (next() as { v: string }).v;
      const right = parseTerm();
      left = op === "+" ? left + right : left - right;
    }
    return left;
  }

  function parseTerm(): number {
    let left = parseFactor();
    while (peek() && peek().t === "op" && ["*", "/", "%"].includes((peek() as { v: string }).v)) {
      const op = (next() as { v: string }).v;
      const right = parseFactor();
      if (op === "*") left = left * right;
      else if (op === "/") left = left / right;
      else left = left % right;
    }
    return left;
  }

  function parseFactor(): number {
    const base = parseUnary();
    if (peek() && peek().t === "op" && (peek() as { v: string }).v === "**") {
      next();
      const exp = parseFactor(); // right-associative
      return Math.pow(base, exp);
    }
    return base;
  }

  function parseUnary(): number {
    const p = peek();
    if (p && p.t === "op" && ((p as { v: string }).v === "+" || (p as { v: string }).v === "-")) {
      const op = (next() as { v: string }).v;
      const val = parseUnary();
      return op === "-" ? -val : val;
    }
    return parseAtom();
  }

  function parseAtom(): number {
    const tok = next();
    if (!tok) throw new Error("unexpected end of input");
    if (tok.t === "num") return tok.v;
    if (tok.t === "lp") {
      const val = parseExpr();
      const close = next();
      if (!close || close.t !== "rp") throw new Error("expected )");
      return val;
    }
    throw new Error("unexpected token");
  }

  if (toks.length === 0) throw new Error("empty expression");
  const result = parseExpr();
  if (pos !== toks.length) throw new Error("trailing input");
  if (Number.isNaN(result)) throw new Error("not a number");
  return result;
}
