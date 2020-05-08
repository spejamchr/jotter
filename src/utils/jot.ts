import Decoder from "jsonous";
import { err, ok, Result } from "resulty";
import { Maybe, nothing, just } from "maybeasy";

export const log = (s: string) => console.log("[SJC] ", s);

type Jot = (0 | 1)[];
export type Func = (a: Func) => Func;

const S: Func = x => y => z => x(z)(y(z));
const K: Func = x => _ => x;
const I: Func = x => x;

const J1: Func = v => f => a => v(f(a));

export const effect = (e: (func: Func) => void, f?: Func): Func => arg => {
  f = f || (x => x);
  e(arg);
  return f(arg);
};

export const jotToFunc = (program: Jot): Func => program.reduce((v, b) => (b ? J1(v) : v(S)(K)), I);

interface NotSet {
  kind: "not-set";
}

interface IsSet<T> {
  kind: "set";
  value: T;
}

interface OverSet<T> {
  kind: "over-set";
  values: T[];
}

type JustOnceState<T> = NotSet | IsSet<T> | OverSet<T>;

const assertNever = (a: never): never => {
  throw new Error(`received unexpected argument: ${a}`);
};

export class JustOnce<T> {
  private state: JustOnceState<T> = { kind: "not-set" };

  kind = () => this.state.kind;

  value = (): Maybe<T> => {
    switch (this.state.kind) {
      case "not-set":
      case "over-set":
        return nothing();
      case "set":
        return just(this.state.value);
    }
  };

  set = (value: T) => {
    switch (this.state.kind) {
      case "not-set":
        this.state = { kind: "set", value };
        break;
      case "set":
        this.state = { kind: "over-set", values: [this.state.value, value] };
        break;
      case "over-set":
        this.state.values.push(value);
        break;
      default:
        assertNever(this.state);
    }
  };
}

export const funcAsBoolean = (func: Func): Maybe<boolean> => {
  const bool = new JustOnce<boolean>();
  func(effect(() => bool.set(true)))(effect(() => bool.set(false)))(I);
  switch (bool.kind()) {
    case "not-set":
    case "over-set":
      return nothing();
    case "set":
      return bool.value();
  }
};

export const funcAsNumber = (func: Func): Maybe<number> => {
  let n = 0;
  let valid = true;
  const notNumber = effect(() => (valid = false));
  func(
    effect(f => {
      n += 1;
      if (f !== notNumber) {
        valid = false;
      }
    })
  )(notNumber);
  return valid ? just(n) : nothing();
};

export const funcAsArray = (func: Func): Func[] => {
  let a: Func[] = [];
  func(effect(f => a.push(f)))(I);
  return a;
};

export const funcAsString = (func: Func): string =>
  funcAsArray(func)
    .map(funcAsNumber)
    .map(mi => mi.map(String.fromCodePoint).getOrElseValue("�"))
    .join("");

// Always succeeds. Converts any character that's not 0 to 1.
export const jotFromString = (str: string): Jot => str.split("").map(c => (c === "0" ? 0 : 1));

export const jotDecoder: Decoder<Jot> = new Decoder((value: any) => {
  if (typeof value !== "string") {
    const errorMsg = `I expected to find a string but instead I found ${JSON.stringify(value)}`;
    return err(errorMsg);
  }

  const array: Jot = [];
  for (let i = 0; i < value.length; i++) {
    switch (value[i]) {
      case "0":
        array.push(0);
        break;
      case "1":
        array.push(1);
        break;
      default:
        return err(`I expected to find '0' or '1', but instead I found ${value[i]}`);
    }
  }

  return ok(array);
});

export const jotToString = (jotA: Jot): string => jotA.join("");

const ILamb = (): Lamb => {
  const vari = lvariable(randWord(5));
  return { kind: "labstraction", vari, body: vari };
};

const J1Lamb = (l: Lamb): Lamb => {
  const f = lvariable(randWord(5));
  const a = lvariable(randWord(5));
  return labstraction(f, labstraction(a, lapplication(l, lapplication(f, a))));
};

const SLamb = (): Lamb => {
  const x = lvariable(randWord(5));
  const y = lvariable(randWord(5));
  const z = lvariable(randWord(5));
  return labstraction(
    x,
    labstraction(y, labstraction(z, lapplication(lapplication(x, z), lapplication(y, z))))
  );
};

const KLamb = (): Lamb => {
  const x = lvariable(randWord(5));
  const y = lvariable(randWord(5));
  return labstraction(x, labstraction(y, x));
};

const J0Lamb = (l: Lamb): Lamb => lapplication(lapplication(l, SLamb()), KLamb());

export const jotToLamb = (jot: Jot): Lamb =>
  jot.reduce((l, j) => (j === 1 ? J1Lamb(l) : J0Lamb(l)), ILamb());

// export const jotToComb = (jot: Jot): Comb => {};

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

export const splitIndex = (pair: string): number => {
  let i = 0;
  let g = 0;

  while ((g > 0 || i === 0 || pair[i] !== " ") && i < pair.length) {
    if (pair[i] === "(") g += 1;
    if (pair[i] === ")") g -= 1;
    i += 1;
  }
  return i;
};

export const findPair = (pair: string): Maybe<[string, string]> => {
  if (pair[0] !== "(" || pair.slice(-1) !== ")") return nothing();

  const inner = pair.slice(1, -1);
  const i = splitIndex(inner);

  if (inner[i] === " ") {
    const first = inner.slice(0, i);
    const second = inner.slice(i + 1);
    return just([first, second]);
  } else {
    return nothing();
  }
};

const validParens = (value: string): boolean => {
  let i = 0;
  let g = 0;
  while (i < value.length) {
    if (value[i] === "(") g++;
    if (value[i] === ")") g--;
    if (g < 0) return false;
    i++;
  }
  return g === 0;
};

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

export const lambToExactString = (lamb: Lamb): string => lambToStringRec(lamb, false, lamb);
export const lambToString = (lamb: Lamb): string => safeShort(lambToExactString(lamb));

export interface Combinator {
  kind: "combinator";
  value: "S" | "K" | "I";
}

export const combinator = (value: Combinator["value"]): Combinator => ({
  kind: "combinator",
  value
});

export interface CApplication {
  kind: "capplication";
  first: Comb;
  second: Comb;
}

export const capplication = (first: Comb, second: Comb): CApplication => ({
  kind: "capplication",
  first,
  second
});

export const capplicationR = (first: string, second: string): Result<string, CApplication> =>
  combDecoder
    .decodeAny(first)
    .map(first => ({ first }))
    .assign("second", combDecoder.decodeAny(second))
    .map(({ first, second }) => capplication(first, second));

export type Comb = Combinator | CApplication;

export const combDecoder: Decoder<Comb> = new Decoder((value: any) => {
  if (typeof value !== "string") {
    const errorMsg = `I expected to find a string but instead I found ${JSON.stringify(value)}`;
    return err(errorMsg);
  }
  if (value === "S" || value === "K" || value === "I") {
    return ok(combinator(value));
  }
  value = value
    .split("")
    .filter(c => c !== " ")
    .reduce(
      (s, c, i) => (i === 0 ? c : s.slice(-1) === "(" || c === ")" ? `${s}${c}` : `${s} ${c}`),
      ""
    );
  value = pairComb(value);

  const applRegex = /^\(.+\)$/i;
  if (applRegex.test(value)) {
    return findPair(value)
      .map(([first, second]) => capplicationR(first, second))
      .getOrElse(() => err(`Invalid combinatory application: "${value}"`));
  }
  return err(`Invalid combinatory expression: "${value}"`);
});

export const combToString = (comb: Comb, second?: boolean): string => {
  switch (comb.kind) {
    case "combinator":
      return comb.value;
    case "capplication":
      const e = `${combToString(comb.first, false)} ${combToString(comb.second, true)}`;
      return second ? `(${e})` : `${e}`;
  }
};

export const combToPrettyString = (comb: Comb): string =>
  combToString(comb)
    .split(" ")
    .join("");

const findGroups = (expr: string): string[] => {
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

// Take a Comb string and pair things up
// "S K K (S K K)" => "(((S K) K) ((S K) K))
export const pairComb = (expr: string): string => {
  if (expr[0] === "(" && expr.slice(-1) === ")") {
    expr = expr.slice(1, -1);
  }
  let groups = findGroups(expr);
  if (groups.length > 1) {
    groups = groups.map(pairComb);
  }
  return groups.reduce((s, g, i) => (i === 0 ? g : `(${s} ${g})`), "");
};

export const hasOuterParens = (expr: string): boolean => {
  if (expr[0] !== "(" || expr.slice(-1) !== ")") return false;

  let i = 1;
  let g = 1;
  while (i < expr.length - 1) {
    if (expr[i] === "(") g++;
    if (expr[i] === ")") g--;
    if (g === 0) return false;
    i++;
  }

  return true;
};

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

const testPairLamb = (s: string) => {
  log(`pairLamb(${JSON.stringify(s)}): ${JSON.stringify(pairLamb(s))}`);
};

testPairLamb("x");
testPairLamb("^x.x x");
testPairLamb("^x.x");
testPairLamb("x x");
testPairLamb("(^a.^b.^c.a c (b c)) (^d.^e.d)");

const combinatorToLamb = (comb: Combinator): Lamb => {
  const x = randWord(5);
  const y = randWord(5);
  const z = randWord(5);
  const trash = () => lvariable("x");
  switch (comb.value) {
    case "S":
      return lambDecoder.decodeAny(`^${x}.^${y}.^${z}.((${x} ${z}) (${y} ${z}))`).getOrElse(trash);
    case "K":
      return lambDecoder.decodeAny(`^${x}.^${y}.${x}`).getOrElse(trash);
    case "I":
      return lambDecoder.decodeAny(`^${x}.${x}`).getOrElse(trash);
  }
};

export const combToLamb = (comb: Comb): Lamb => {
  switch (comb.kind) {
    case "combinator":
      return combinatorToLamb(comb);
    case "capplication":
      return {
        kind: "lapplication",
        first: combToLamb(comb.first),
        second: combToLamb(comb.second)
      };
  }
};

const lambIsI = (lamb: Lamb): boolean =>
  lamb.kind === "labstraction" &&
  lamb.body.kind === lamb.vari.kind &&
  lamb.body.value === lamb.vari.kind;

const lambIsK = (lamb: Lamb): boolean =>
  lamb.kind === "labstraction" &&
  lamb.body.kind === "labstraction" &&
  lamb.body.body.kind === lamb.vari.kind &&
  lamb.body.body.value === lamb.vari.kind;

// S: ^x.^y.^z.((x z) (y z))
const lambIsS = (lamb: Lamb): boolean =>
  lamb.kind === "labstraction" &&
  lamb.body.kind === "labstraction" &&
  lamb.body.body.kind === "labstraction" &&
  lamb.body.body.body.kind === "lapplication" &&
  lamb.body.body.body.first.kind === "lapplication" &&
  lamb.body.body.body.first.first.kind === "lvariable" &&
  lamb.body.body.body.first.first.value === lamb.vari.value &&
  lamb.body.body.body.first.second.kind === "lvariable" &&
  lamb.body.body.body.first.second.value === lamb.body.body.vari.value &&
  lamb.body.body.body.second.kind === "lapplication" &&
  lamb.body.body.body.second.first.kind === "lvariable" &&
  lamb.body.body.body.second.first.value === lamb.body.vari.value &&
  lamb.body.body.body.second.second.kind === "lvariable" &&
  lamb.body.body.body.second.second.value === lamb.body.body.vari.value;

export const lambToComb = (lamb: Lamb): Comb => {
  if (lambIsI(lamb)) {
    return combinator("I");
  } else if (lambIsK(lamb)) {
    return combinator("K");
  } else if (lambIsS(lamb)) {
    return combinator("S");
  }

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
          if (lamb.body.body.kind === "lvariable" && lamb.body.body.value === lamb.vari.value) {
            return combinator("K");
          } else if (!new RegExp(`\\b${lamb.vari.value}\\b`).test(lambToExactString(lamb.body))) {
            return capplication(combinator("K"), lambToComb(lamb.body));
          } else {
            return lambToComb(
              labstractionR(lamb.vari.value, combToString(lambToComb(lamb.body)))
                .map<Lamb>(x => x)
                .getOrElseValue(lvariable("I"))
            );
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

const SJot: Jot = [1, 1, 1, 1, 1, 0, 0, 0];
const KJot: Jot = [1, 1, 1, 0, 0];
const IJot: Jot = [1, 1, 0, 1, 0];
const OneJot: Jot = [1];

const handleCombinator = (comb: Combinator): Jot => {
  switch (comb.value) {
    case "S":
      return SJot;
    case "K":
      return KJot;
    case "I":
      return IJot;
    // return combToJot(
    //   capplication(capplication(combinator("S"), combinator("K")), combinator("K"))
    // );
  }
};

export const combToJot = (comb: Comb): Jot => {
  switch (comb.kind) {
    case "combinator":
      return handleCombinator(comb);
    case "capplication":
      return OneJot.concat(combToJot(comb.first)).concat(combToJot(comb.second));
  }
};

const randWord = (length: number): string =>
  Array(length)
    .fill(null)
    .map(() =>
      Math.random()
        .toString(36)
        .substr(2)
    )
    .join("")
    .replace(/[0-9]/g, "")
    .slice(0, 5);

// Mangles variable names in expressions
const m = (expr: string): string => {
  const vars = (expr.match(/[a-z_]+/gi) || []).filter((v, i, a) => a.indexOf(v) === i);
  let mangled = vars.reduce((a, v, i) => a.replace(new RegExp(`\\b${v}\\b`, "g"), String(i)), expr);
  for (let i = vars.length - 1; i >= 0; i--) {
    mangled = mangled.replace(new RegExp(`${i}`, "g"), randWord(5));
  }
  return mangled;
};

// shortens variable names in lambda expressions without colliding
const safeShort = (expr: string): string => {
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

export const testLambToComb = (name: string, lamb: string) => {
  const mangled = m(lamb);
  window.setTimeout(() => {
    log(`[test] ${name} before: ${lamb} -> ${mangled}`);
    lambDecoder
      .decodeAny(mangled)
      .map(lambToComb)
      .map(combToString)
      .elseDo(() => console.warn(`[error] Invalid Lambda: ${name}`))
      .do(comb =>
        combDecoder
          .decodeAny(comb)
          .map(combToJot)
          .map(jotToString)
          .do(v => log(`[test] ${name}: ${v.length}`))
          .elseDo(() => console.warn(`[error] Invalid Comb: ${name}`))
      );
  }, 500);
};

const oddsToOne = (dec: string): 0 | 1 => (Number(dec.slice(-1)) % 2 === 0 ? 0 : 1);

const divByTwo = (dec: string): string => {
  let newDec = "";
  let add = 0;
  let nextAdd = 0;
  for (let i = 0; i < dec.length; i++) {
    const chr = dec[i];
    add = nextAdd;
    nextAdd = oddsToOne(chr) ? 5 : 0;
    newDec += String(Math.floor(Number(chr) / 2) + add);
  }
  return newDec[0] === "0" ? newDec.slice(1) : newDec;
};

const multByTwo = (dec: string): string => {
  let newDec = "";
  let carry = 0;
  let nextCarry = 0;
  for (let i = dec.length - 1; i >= 0; i--) {
    const chr = dec[i];
    carry = nextCarry;
    nextCarry = Number(chr) > 4 ? 1 : 0;
    newDec = String(Number(chr) * 2 + carry).slice(-1) + newDec;
  }
  if (nextCarry) {
    newDec = String(nextCarry) + newDec;
  }
  return newDec;
};

const addOne = (dec: string): string => {
  if (dec.slice(-1) === "9") {
    return addOne(dec.slice(0, -1)) + "0";
  } else {
    return dec.slice(0, -1) + String(Number(dec.slice(-1)) + 1);
  }
};

export const decToBin = (dec: string): string => {
  if (!/^[0-9]*$/i.test(dec)) {
    return "";
  }
  let stack = dec === "0" ? "0" : "";
  while (dec !== "0" && dec !== "") {
    stack = `${oddsToOne(dec)}${stack}`;
    dec = divByTwo(dec);
  }
  return stack;
};

export const binToDec = (bin: string): string => {
  if (!/^[01]*$/i.test(bin)) {
    return "";
  }
  let stack = "0";
  while (bin !== "") {
    stack = multByTwo(stack);
    if (bin[0] === "1") {
      stack = addOne(stack);
    }
    bin = bin.slice(1);
  }
  return stack;
};

const Y = "^f.(^x.(f (x x)) ^x.(f (x x)))";

const ZERO = "^x.^y.y";
const ONE = "^x.^y.(x y)";
const TWO = "^x.^y.(x (x y))";
const THREE = "^x.^y.(x (x (x y)))";
const FOUR = "^x.^y.(x (x (x (x y))))";
const FIVE = "^x.^y.(x (x (x (x (x y)))))";
const NINE = "^x.^y.(x (x (x (x (x (x (x (x (x y)))))))))";
const TEN = "^x.^y.(x (x (x (x (x (x (x (x (x (x y))))))))))";

const INCREMENT = "^n.^x.^y.(x ((n x) y))";
const PLUS = "^m.^n.^f.^x.((m f) ((n f) x))";
const MULT = "^m.^n.^f.^x.((m (n f)) x)";
const EXP = "^m.^n.(n m)";
const DECREMENT = "^n.^f.^x.(((n ^g.^h.(h (g f))) ^u.x) ^u.u)";
const SUBTRACT = `^m.^o.((o ${m(DECREMENT)}) m)`;

// 128513
// 10**5 + 2*10**4 + 8*10**3 + 5*10**2 + 13
// 18**4 + 12**4 + 7**4 + 4*10**2
const NUM = `((${m(PLUS)} ((${m(EXP)} ((${m(PLUS)} ((${m(EXP)} ${m(FOUR)}) ${m(TWO)})) ${m(
  TWO
)})) ${m(FOUR)})) ((${m(PLUS)} ((${m(EXP)} ((${m(PLUS)} ((${m(EXP)} ${m(TWO)}) ${m(THREE)})) ${m(
  FOUR
)})) ${m(FOUR)})) ((${m(PLUS)} ((${m(EXP)} ((${m(PLUS)} ${m(FIVE)}) ${m(TWO)})) ${m(FOUR)})) ((${m(
  MULT
)} ${m(FOUR)}) ((${m(EXP)} ${m(TEN)}) ${m(TWO)})))))`;
log("big number");
log(
  lambDecoder
    .decodeAny(safeShort(NUM))
    .map(lambToExactString)
    .getOrElseValue("")
);

const TRUE_ = "^f.^s.f";
const FALSE_ = "^f.^s.s";
// const NOT = "^b.^f.^s.((b s) f)";
// const AND = "^ba.^bb.((ba bb) ba)";

const IS_ZERO = `^n.((n ^x.${m(FALSE_)}) ${m(TRUE_)})`;
const IS_LESS_OR_EQUAL = `^m.^n.(${m(IS_ZERO)} ((${m(SUBTRACT)} m) n))`;
// const IS_EQUAL = `^m.^n.((${m(AND)} ((${m(IS_LESS_OR_EQUAL)} m) n)) ((${m(
//   IS_LESS_OR_EQUAL
// )} n) m))`;

const MINIMOD = `^mod.^n.^q.((((${m(IS_LESS_OR_EQUAL)} n) q) ((mod ((${m(SUBTRACT)} n) q)) q)) n)`;
const MOD = `(${m(Y)} ${m(MINIMOD)})`;

const MINIDIV = `^div.^n.^q.((((${m(IS_LESS_OR_EQUAL)} n) q) (${m(INCREMENT)} ((div ((${m(
  SUBTRACT
)} n) q)) q))) ${m(ZERO)})`;
const DIV = `(${m(Y)} ${m(MINIDIV)})`;

// Pairs
const PAIR = "^a.^b.^f.((f a) b)";
// const FIRST = "^p.(p ^a.^b.a)";
// const SECOND = "^p.(p ^a.^b.b)";

const EMPTY_LIST = "^c.^n.n";
// const IS_EMPTY = `^l.((l ^h.^t.${m(FALSE_)}) ${m(TRUE_)})`;
const CONS = "^h.^t.^c.^n.((c h) ((t c) n))";
// const HEAD = `^l.((l ^h.^t.h) ${m(FALSE_)})`;
// const TAIL = "^l.^c.^n.(((l ^h.^t.^g.((g h) (t c))) ^t.n) ^h.^t.t)";

const FOLD_RIGHT = PAIR;
const MAP = `^f.((${m(FOLD_RIGHT)} ^x.(${m(CONS)} (f x))) ${m(EMPTY_LIST)})`;

const MINIRANGE = `^range.^min.^max.((((${m(IS_LESS_OR_EQUAL)} min) max) ((${m(
  CONS
)} min) ((range (${m(INCREMENT)} min)) max))) ${m(EMPTY_LIST)})`;
const RANGE = `(${m(Y)} ${m(MINIRANGE)})`;
const APPEND = `(${m(FOLD_RIGHT)} ${m(CONS)})`;
const PUSH = `^value.(${m(APPEND)} ((${m(CONS)} value) ${m(EMPTY_LIST)}))`;
// const REVERSE = `((${m(FOLD_RIGHT)} ${m(PUSH)}) ${m(EMPTY_LIST)})`;

const B_ = TEN;
const F_ = "^x.^y.(x (x (x (x (x (x (x (x (x (x (x y)))))))))))"; // 11
const I_ = "^x.^y.(x (x (x (x (x (x (x (x (x (x (x (x y))))))))))))"; // 12
const U_ = "^x.^y.(x (x (x (x (x (x (x (x (x (x (x (x (x y)))))))))))))"; // 13
const Z_ = "^x.^y.(x (x (x (x (x (x (x (x (x (x (x (x (x (x y))))))))))))))"; // 14
const FIFTEEN = "^x.^y.(x (x (x (x (x (x (x (x (x (x (x (x (x (x (x y)))))))))))))))";
const HUNDRED =
  "^x.^y.(x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x y))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))";

const MINI_TO_DIGITS = `^to_digits.^n.((${m(PUSH)} ((${m(MOD)} n) ${m(TEN)})) ((((${m(
  IS_LESS_OR_EQUAL
)} n) ${m(NINE)}) ${m(EMPTY_LIST)}) (to_digits ((${m(DIV)} n) ${m(TEN)}))))`;
const TO_DIGITS = `(${m(Y)} ${m(MINI_TO_DIGITS)})`;
const TO_STRING = TO_DIGITS;

export const YES = `((${m(CONS)} ${m(ZERO)}) ((${m(CONS)} ${m(ONE)}) ((${m(CONS)} ${m(TWO)}) ${m(
  EMPTY_LIST
)})))`;
log(YES);
lambDecoder
  .decodeAny(YES)
  .map(lambToComb)
  .map(combToJot)
  .map(jotToString)
  .do(log);

const FIZZ = `((${m(CONS)} ${m(F_)}) ((${m(CONS)} ${m(I_)}) ((${m(CONS)} ${m(Z_)}) ((${m(CONS)} ${m(
  Z_
)}) ${m(EMPTY_LIST)}))))`;
log(FIZZ);
const BUZZ = `((${m(CONS)} ${m(B_)}) ((${m(CONS)} ${m(U_)}) ((${m(CONS)} ${m(Z_)}) ((${m(CONS)} ${m(
  Z_
)}) ${m(EMPTY_LIST)}))))`;

export const FIZZBUZZ = `((${m(MAP)} ^num.(((${m(IS_ZERO)} ((${m(MOD)} num) ${m(FIFTEEN)})) ((${m(
  APPEND
)} ${m(BUZZ)}) ${m(FIZZ)})) (((${m(IS_ZERO)} ((${m(MOD)} num) ${m(THREE)})) ${m(FIZZ)}) (((${m(
  IS_ZERO
)} ((${m(MOD)} num) ${m(FIVE)})) ${m(BUZZ)}) (${m(TO_STRING)} num))))) ((${m(RANGE)} ${m(ONE)}) ${m(
  HUNDRED
)}))`;
