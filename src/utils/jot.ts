import Decoder from "jsonous";
import { err, ok, Result } from "resulty";
import { Maybe, nothing, just } from "maybeasy";

type Jot = (0 | 1)[];
type Func = (a: Func) => Func;

const S: Func = x => y => z => x(z)(y(z));
const K: Func = x => _ => x;
const I: Func = x => x;

const J1: Func = v => f => a => v(f(a));

export const effect = (f: (func: Func) => void): Func => func => {
  f(func);
  return func;
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
      console.log("Boolean functions never ran");
      return nothing();
    case "set":
      return bool.value();
    case "over-set":
      console.log("Boolean functions over-ran");
      return nothing();
  }
};

export const funcAsNumber = (func: Func): Maybe<number> => {
  let n = 0;
  let valid = true;
  const I0: Func = x => x;
  func(
    effect(f => {
      n += 1;
      if (f !== I0) {
        valid = false;
      }
    })
  )(I0);
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
    .map(mi => mi.map(String.fromCharCode).getOrElseValue("�"))
    .join("");

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

export const findGroups = (pair: string): Maybe<[string, string]> => {
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

const test = "(^n.^x.^y.(x ((n x) y))";
console.log(`findGroups('${test}'): ${JSON.stringify(findGroups(test))}`);
console.log(`findGroups('${test + " ^x.x)"}'): ${JSON.stringify(findGroups(test + " ^x.x)"))}`);

export const lambDecoder: Decoder<Lamb> = new Decoder((value: any) => {
  if (typeof value !== "string") {
    const errorMsg = `I expected to find a string but instead I found ${JSON.stringify(value)}`;
    return err(errorMsg);
  }

  const variRegex = /^[a-z_]+$/i;
  const abstRegex = /^\^([a-z_]+)\.(.+)$/i;
  const applRegex = /^\(.+\)$/i;

  if (variRegex.test(value)) {
    return ok(lvariable(value));
  } else if (abstRegex.test(value)) {
    const matches = value.match(abstRegex) || [];
    return labstractionR(matches[1], matches[2]);
  } else if (applRegex.test(value)) {
    return findGroups(value)
      .map(([first, second]) => lapplicationR(first, second))
      .getOrElse(() => err(`Invalid lambda application: "${value}"`));
  } else {
    return err(`Invalid lambda expression: "${value}"`);
  }
});

export const lambToString = (lamb: Lamb): string => {
  switch (lamb.kind) {
    case "lvariable":
      return lamb.value;
    case "labstraction":
      return `^${lamb.vari.value}.${lambToString(lamb.body)}`;
    case "lapplication":
      return `(${lambToString(lamb.first)} ${lambToString(lamb.second)})`;
  }
};

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

export const capplication = (first: string, second: string): Result<string, CApplication> =>
  combDecoder
    .decodeAny(first)
    .map(first => ({ first }))
    .assign("second", combDecoder.decodeAny(second))
    .map<CApplication>(fs => ({ kind: "capplication", ...fs }));

export type Comb = Combinator | CApplication;

export const combDecoder: Decoder<Comb> = new Decoder((value: any) => {
  if (typeof value !== "string") {
    const errorMsg = `I expected to find a string but instead I found ${JSON.stringify(value)}`;
    return err(errorMsg);
  }
  if (value === "S" || value === "K" || value === "I") {
    return ok(combinator(value));
  }

  const applRegex = /^\(.+\)$/i;
  if (applRegex.test(value)) {
    return findGroups(value)
      .map(([first, second]) =>
        combDecoder
          .decodeAny(first)
          .map(first => ({ first }))
          .assign("second", combDecoder.decodeAny(second))
          .map<Comb>(fs => ({ kind: "capplication", ...fs }))
      )
      .getOrElse(() => err(`Invalid combinatory application: "${value}"`));
  }
  return err(`Invalid combinatory expression: "${value}"`);
});

export const combToString = (comb: Comb): string => {
  switch (comb.kind) {
    case "combinator":
      return comb.value;
    case "capplication":
      return `(${combToString(comb.first)} ${combToString(comb.second)})`;
  }
};

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
      return {
        kind: "capplication",
        first: lambToComb(lamb.first),
        second: lambToComb(lamb.second)
      };
    case "labstraction":
      switch (lamb.body.kind) {
        case "lvariable":
          if (lamb.vari.value === lamb.body.value) {
            return combinator("I");
          } else {
            return { kind: "capplication", first: combinator("K"), second: lambToComb(lamb.body) };
          }
        case "labstraction":
          if (!new RegExp(`\\b${lamb.vari.value}\\b`).test(lambToString(lamb.body))) {
            return { kind: "capplication", first: combinator("K"), second: lambToComb(lamb.body) };
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
          return {
            kind: "capplication",
            first: { kind: "capplication", first: combinator("S"), second: lambToComb(a) },
            second: lambToComb(b)
          };
      }
  }
};

const handleCombinator = (comb: Combinator): Jot => {
  switch (comb.value) {
    case "S":
      return [1, 1, 1, 1, 1, 0, 0, 0];
    case "K":
      return [1, 1, 1, 0, 0];
    case "I":
      return combToJot({
        kind: "capplication",
        first: { kind: "capplication", first: combinator("S"), second: combinator("K") },
        second: combinator("K")
      });
  }
};

export const combToJot = (comb: Comb): Jot => {
  switch (comb.kind) {
    case "combinator":
      return handleCombinator(comb);
    case "capplication":
      const one: Jot = [1];
      return one.concat(combToJot(comb.first)).concat(combToJot(comb.second));
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
    .slice(0, 1);

// Mangles variable names in expressions
const m = (expr: string): string => {
  const vars = (expr.match(/[a-z_]+/gi) || []).filter((v, i, a) => a.indexOf(v) === i);
  let mangled = vars.reduce((a, v, i) => a.replace(new RegExp(`\\b${v}\\b`, "g"), String(i)), expr);
  for (let i = vars.length - 1; i >= 0; i--) {
    mangled = mangled.replace(new RegExp(`${i}`, "g"), randWord(5));
  }
  return mangled;
};

export const testLambToComb = (name: string, lamb: string) => {
  const mangled = m(lamb);
  window.setTimeout(() => {
    console.log(`[test] ${name} before: ${lamb} -> ${mangled}`);
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
          .do(v => console.log(`[test] ${name}: ${v.length}`))
          .elseDo(() => console.warn(`[error] Invalid Comb: ${name}`))
      );
  }, 500);
};

const Y = "^f.(^x.(f (x x)) ^x.(f (x x)))";

const ZERO = "^x.^y.y";
const ONE = "^x.^y.(x y)";
const TWO = "^x.^y.(x (x y))";
const THREE = "^x.^y.(x (x (x y)))";
// const FOUR = "^x.^y.(x (x (x (x y))))";
const FIVE = "^x.^y.(x (x (x (x (x y)))))";

const INCREMENT = "^n.^x.^y.(x ((n x) y))";
// const PLUS = "^m.^n.^f.^x.((m f) ((n f) x))";
// const MULT = "^m.^n.^f.^x.((m (n f)) x)";
// const EXP = "^m.^n.(n m)";
const DECREMENT = "^n.^f.^x.(((n ^g.^h.(h (g f))) ^u.x) ^u.u)";
const SUBTRACT = `^m.^o.((o ${m(DECREMENT)}) m)`;

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

const NINE = "^x.^y.(x (x (x (x (x (x (x (x (x y)))))))))";
const TEN = "^x.^y.(x (x (x (x (x (x (x (x (x (x y))))))))))";
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
console.log(YES);
lambDecoder
  .decodeAny(YES)
  .map(lambToComb)
  .map(combToJot)
  .map(jotToString)
  .do(console.log);

const FIZZ = `((${m(CONS)} ${m(F_)}) ((${m(CONS)} ${m(I_)}) ((${m(CONS)} ${m(Z_)}) ((${m(CONS)} ${m(
  Z_
)}) ${m(EMPTY_LIST)}))))`;
console.log(FIZZ);
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
