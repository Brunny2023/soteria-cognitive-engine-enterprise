// Deterministic arithmetic evaluator used by the executive execution tools.
// No eval / Function construction: a tokenizer + shunting-yard parser only.

export type Aggregates = Record<string, number>;

const OPS: Record<
  string,
  { prec: number; assoc: "L" | "R"; fn: (a: number, b: number) => number }
> = {
  "+": { prec: 1, assoc: "L", fn: (a, b) => a + b },
  "-": { prec: 1, assoc: "L", fn: (a, b) => a - b },
  "*": { prec: 2, assoc: "L", fn: (a, b) => a * b },
  "/": { prec: 2, assoc: "L", fn: (a, b) => a / b },
  "%": { prec: 2, assoc: "L", fn: (a, b) => a % b },
  "^": { prec: 3, assoc: "R", fn: (a, b) => a ** b },
};

export function datasetAggregates(dataset: number[]): Aggregates {
  if (dataset.length === 0) return { count: 0, sum: 0, avg: 0, min: 0, max: 0 };
  const sum = dataset.reduce((a, b) => a + b, 0);
  return {
    count: dataset.length,
    sum,
    avg: sum / dataset.length,
    min: Math.min(...dataset),
    max: Math.max(...dataset),
  };
}

function tokenize(expr: string): string[] {
  const tokens = expr.match(/\d+(\.\d+)?|[A-Za-z_][A-Za-z0-9_]*|[+\-*/%^()]/g);
  if (!tokens) throw new Error("Expression contains no evaluable tokens");
  const joined = tokens.join("");
  if (joined.length !== expr.replace(/\s+/g, "").length) {
    throw new Error("Expression contains unsupported characters");
  }
  return tokens;
}

export function evaluateExpression(expr: string, vars: Aggregates = {}): number {
  const tokens = tokenize(expr);
  const out: number[] = [];
  const ops: string[] = [];

  const apply = (op: string) => {
    const b = out.pop();
    const a = out.pop();
    if (a === undefined || b === undefined) throw new Error("Malformed expression");
    out.push(OPS[op].fn(a, b));
  };

  let prevType: "value" | "op" | null = null;
  for (const t of tokens) {
    if (/^\d/.test(t)) {
      out.push(Number(t));
      prevType = "value";
    } else if (/^[A-Za-z_]/.test(t)) {
      if (!(t in vars)) throw new Error(`Unknown variable "${t}"`);
      out.push(vars[t]);
      prevType = "value";
    } else if (t === "(") {
      ops.push(t);
      prevType = null;
    } else if (t === ")") {
      while (ops.length && ops[ops.length - 1] !== "(") apply(ops.pop()!);
      if (!ops.length) throw new Error("Unbalanced parentheses");
      ops.pop();
      prevType = "value";
    } else {
      // unary minus
      if (t === "-" && prevType !== "value") {
        out.push(0);
      }
      const o = OPS[t];
      while (ops.length) {
        const top = ops[ops.length - 1];
        if (top === "(") break;
        const to = OPS[top];
        if (to.prec > o.prec || (to.prec === o.prec && o.assoc === "L")) apply(ops.pop()!);
        else break;
      }
      ops.push(t);
      prevType = "op";
    }
  }
  while (ops.length) {
    const op = ops.pop()!;
    if (op === "(") throw new Error("Unbalanced parentheses");
    apply(op);
  }
  if (out.length !== 1 || !Number.isFinite(out[0]))
    throw new Error("Expression did not resolve to a finite number");
  return out[0];
}
