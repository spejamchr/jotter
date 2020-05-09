import Decoder from "jsonous";
import { err, ok, Result } from "resulty";
import { capplication, Comb, combinator, findPair } from "./comb";
import { hasOuterParens, validParens } from "./tools";

export interface LVariable {
  kind: "lvariable";
  value: string;
}

export const lvariable = (value: string): LVariable => ({
  kind: "lvariable",
  value
});

export interface LAbstraction {
  kind: "labstraction";
  vari: LVariable;
  body: Lamb;
}

export const labstraction = (vari: string | LVariable, body: Lamb): LAbstraction => ({
  kind: "labstraction",
  vari: typeof vari === "string" ? lvariable(vari) : vari,
  body
});

export const labstractionR = (vari: string, body: string): Result<string, LAbstraction> =>
  lambDecoder.decodeAny(body).map<LAbstraction>(body => labstraction(vari, body));

export interface LApplication {
  kind: "lapplication";
  first: Lamb;
  second: Lamb;
}

export const lapplication = (first: Lamb, second: Lamb): LApplication => ({
  kind: "lapplication",
  first,
  second
});

export const lapplicationR = (first: string, second: string): Result<string, LApplication> =>
  lambDecoder
    .decodeAny(first)
    .map(first => ({ first }))
    .assign("second", lambDecoder.decodeAny(second))
    .map(({ first, second }) => lapplication(first, second));

export type Lamb = LVariable | LAbstraction | LApplication;

export const lambDecoder: Decoder<Lamb> = new Decoder((value: any) => {
  if (typeof value !== "string") {
    const errorMsg = `I expected to find a string but instead I found ${JSON.stringify(value)}`;
    return err(errorMsg);
  }
  const invalidChars = value.match(/[^a-z _^.()]/gi);
  if (invalidChars) {
    return err(`Invalid character(s) in lambda expression: ${invalidChars.join(", ")}`);
  }
  if (!validParens(value)) {
    return err("Unmatched paren(s)");
  }

  const variRegex = /^[a-z_]+$/i;
  const abstRegex = /^\^([a-z_]+)\.(.+)$/i;
  const parenAbstRegex = /^\(\^([a-z_]+)\.(.+)\)$/i;
  const parenApplRegex = /^\(.+ .+\)$/i;
  const applRegex = /^.+ .+$/i;

  if (variRegex.test(value)) {
    return ok(lvariable(value));
  } else if (abstRegex.test(value)) {
    const matches = value.match(abstRegex) || [];
    return labstractionR(matches[1], matches[2]);
  } else if (parenAbstRegex.test(value)) {
    const matches = value.match(parenAbstRegex) || [];
    return labstractionR(matches[1], matches[2]);
  } else if (parenApplRegex.test(value) || applRegex.test(value)) {
    return findPair(pairLamb(value))
      .map(([first, second]) => lapplicationR(first, second))
      .getOrElse(() => err(`Invalid lambda application: "${value}"`));
  } else {
    return err(`Invalid lambda expression: "${value}"`);
  }
});

const lambToStringRec = (lamb: Lamb, second: boolean, parent: Lamb): string => {
  switch (lamb.kind) {
    case "lvariable":
      return lamb.value;
    case "labstraction": {
      const e = `^${lamb.vari.value}.${lambToStringRec(lamb.body, false, lamb)}`;
      const parenAbstr = parent.kind !== "labstraction";
      return parenAbstr ? `(${e})` : e;
    }
    case "lapplication": {
      const e =
        lambToStringRec(lamb.first, false, lamb) + " " + lambToStringRec(lamb.second, true, lamb);
      return second || lamb === parent ? `(${e})` : e;
    }
  }
};

// shortens variable names in lambda expressions without colliding
export const safeShort = (expr: string): string => {
  const alphabet = "abcdefghijklmnopqrstuvwxyz";
  let a = 0;
  let l = alphabet[a];
  const vars = (expr.match(/[a-z_]+/gi) || []).filter((v, i, a) => a.indexOf(v) === i).reverse();
  let short = vars.reduce((a, v, i) => a.replace(new RegExp(`\\b${v}\\b`, "g"), String(i)), expr);
  for (let i = vars.length - 1; i >= 0; i--) {
    short = short.replace(new RegExp(`${i}`, "g"), l);
    a += 1;
    if (a === alphabet.length) {
      a = 0;
      l = `${l}${alphabet[a]}`;
    } else {
      l = `${l.slice(0, -2)}${alphabet[a]}`;
    }
  }
  return short;
};

export const lambToExactString = (lamb: Lamb): string => lambToStringRec(lamb, false, lamb);
export const lambToString = (lamb: Lamb): string => safeShort(lambToExactString(lamb));

// Only to be used for Lambda Applications (not abstractions or variables)
const findLambGroups = (expr: string): string[] => {
  let groups: [number, number][] = [];
  let i = 0;
  let g = 0;
  let inGroup = true;
  let groupStart = 0;
  let groupEnd: number;
  while (i < expr.length) {
    const c = expr[i];

    if (inGroup) {
      if (c === " " && g === 0) {
        groupEnd = i;
        groups.push([groupStart, groupEnd]);
        inGroup = false;
      }
    } else if (c === "^" && g === 0) {
      // The rest of the string is an abstraction
      groupStart = i;
      i = expr.length;
      break;
    } else if (c !== " ") {
      groupStart = i;
      inGroup = true;
    }

    if (c === "(") g++;
    if (c === ")") g--;

    i++;
  }
  if (expr.slice(-1) !== " ") groups.push([groupStart, i]);
  return groups.map(([a, b]) => expr.slice(a, b));
};

// Take a Lamb string and pair things up. Abstraction take precedence over application.
// "(^a.^b.^c.a c (b c)) (^d.^e.d)" => "((^a.^b.^c.((a c) (b c))) (^d.^e.d))"
export const pairLamb = (expr: string): string => {
  if (hasOuterParens(expr)) {
    expr = expr.slice(1, -1);
  }

  if (/^[a-z_]+$/i.test(expr)) {
    return expr;
  } else if (/^\^[a-z_]+\./i.test(expr)) {
    let i = 0;
    let inDef = true;
    let inBody = false;
    while (!inBody) {
      i++;
      if (inDef) {
        inDef = expr[i] !== ".";
      } else {
        inDef = expr[i] === "^";
        inBody = expr[i] !== "^";
      }
    }
    return "(" + expr.slice(0, i) + pairLamb(expr.slice(i)) + ")";
  } else {
    let groups = findLambGroups(expr);
    if (groups.length > 1) {
      groups = groups.map(pairLamb);
    }
    return groups.reduce((s, g, i) => (i === 0 ? g : `(${s} ${g})`), "");
  }
};

const lambHasVariable = (lamb: Lamb, vari: string): boolean => {
  switch (lamb.kind) {
    case "lvariable":
      return lamb.value === vari;
    case "labstraction":
      return lambHasVariable(lamb.body, vari);
    case "lapplication":
      return lambHasVariable(lamb.first, vari) || lambHasVariable(lamb.second, vari);
  }
};

// Only used in lambToComb: There's a part where we need to mix a comb into a lamb
const combAsLamb = (comb: Comb): Lamb => {
  switch (comb.kind) {
    case "combinator":
      return lvariable(comb.value);
    case "capplication":
      return lapplication(combAsLamb(comb.first), combAsLamb(comb.second));
  }
};

export const lambToComb = (lamb: Lamb): Comb => {
  switch (lamb.kind) {
    case "lvariable":
      if (lamb.value === "S" || lamb.value === "K" || lamb.value === "I") {
        return combinator(lamb.value);
      } else {
        return combinator(lamb.value as "S");
        // throw `bad variable name: ${lamb.value}`;
      }
    case "lapplication":
      return capplication(lambToComb(lamb.first), lambToComb(lamb.second));
    case "labstraction":
      switch (lamb.body.kind) {
        case "lvariable":
          if (lamb.vari.value === lamb.body.value) {
            return combinator("I");
          } else {
            return capplication(combinator("K"), lambToComb(lamb.body));
          }
        case "labstraction":
          let app: Lamb;
          if (lamb.body.body.kind === "lvariable" && lamb.body.body.value === lamb.vari.value) {
            return combinator("K");
          } else if (
            lamb.body.body.kind === "labstraction" &&
            (app = lamb.body.body.body) &&
            app.kind === "lapplication" &&
            app.first.kind === "lapplication" &&
            app.first.first.kind === "lvariable" &&
            app.first.first.value === lamb.vari.value &&
            app.first.second.kind === "lvariable" &&
            app.first.second.value === lamb.body.body.vari.value &&
            app.second.kind === "lapplication" &&
            app.second.first.kind === "lvariable" &&
            app.second.first.value === lamb.body.vari.value &&
            app.second.second.kind === "lvariable" &&
            app.second.second.value === lamb.body.body.vari.value
          ) {
            return combinator("S");
          } else if (!lambHasVariable(lamb.body, lamb.vari.value)) {
            return capplication(combinator("K"), lambToComb(lamb.body));
          } else {
            return lambToComb(labstraction(lamb.vari, combAsLamb(lambToComb(lamb.body))));
          }
        case "lapplication":
          const a = { ...lamb };
          const b = { ...lamb };
          a.body = lamb.body.first;
          b.body = lamb.body.second;

          return capplication(capplication(combinator("S"), lambToComb(a)), lambToComb(b));
      }
  }
};
