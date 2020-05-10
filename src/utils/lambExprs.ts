import { randWord } from "./tools";

// Mangles variable names in expressions
const m = (expr: string): string => {
  const vars = (expr.match(/[a-z_]+/gi) || []).filter((v, i, a) => a.indexOf(v) === i);
  let mangled = vars.reduce((a, v, i) => a.replace(new RegExp(`\\b${v}\\b`, "g"), String(i)), expr);
  for (let i = vars.length - 1; i >= 0; i--) {
    mangled = mangled.replace(new RegExp(`${i}`, "g"), randWord(vars.length));
  }
  return mangled;
};

export const Y = "(^f.(^x.(f (x x)) ^x.(f (x x))))";

export const ZERO = "(^x.^y.y)";
export const ONE = "(^x.^y.(x y))";
export const TWO = "(^x.^y.(x (x y)))";
export const THREE = "(^x.^y.(x (x (x y))))";
export const FOUR = "(^x.^y.(x (x (x (x y)))))";
export const FIVE = "(^x.^y.(x (x (x (x (x y))))))";
export const NINE = "(^x.^y.(x (x (x (x (x (x (x (x (x y))))))))))";
export const TEN = "(^x.^y.(x (x (x (x (x (x (x (x (x (x y)))))))))))";

export const INCREMENT = "(^n.^x.^y.(x ((n x) y)))";
export const PLUS = "(^m.^n.^f.^x.((m f) ((n f) x)))";
export const MULT = "(^m.^n.^f.^x.((m (n f)) x))";
export const EXP = "(^m.^n.(n m))";
export const DECREMENT = "(^n.^f.^x.(((n ^g.^h.(h (g f))) ^u.x) ^u.u))";
export const SUBTRACT = `(^m.^o.((o ${m(DECREMENT)}) m))`;

// 128513: Unicode code point for an emoji
// 18**4 + 12**4 + 7**4 + 4*10**2
export const NUM = `((${m(PLUS)} ((${m(EXP)} ((${m(PLUS)} ((${m(EXP)} ${m(FOUR)}) ${m(TWO)})) ${m(
  TWO
)})) ${m(FOUR)})) ((${m(PLUS)} ((${m(EXP)} ((${m(PLUS)} ((${m(EXP)} ${m(TWO)}) ${m(THREE)})) ${m(
  FOUR
)})) ${m(FOUR)})) ((${m(PLUS)} ((${m(EXP)} ((${m(PLUS)} ${m(FIVE)}) ${m(TWO)})) ${m(FOUR)})) ((${m(
  MULT
)} ${m(FOUR)}) ((${m(EXP)} ${m(TEN)}) ${m(TWO)})))))`;

export const makeSince = () => {
  let lastCalled = new Date().valueOf();
  return () => {
    const now = new Date().valueOf();
    const result = now - lastCalled;
    lastCalled = now;
    return result;
  };
};

// log("big number");
// const since = makeSince();
// log("started " + since());
// log(
//   lambDecoder
//     .decodeAny(NUM)
//     .do(() => log("lambDecoder time " + since()))
//     .map(lambToString)
//     .do(() => log("lambToString time " + since()))
//     .getOrElseValue("")
// );

// lambDecoder
//   .decodeAny(NUM)
//   .do(() => log("lambDecoder time " + since()))
//   .map(lambToComb)
//   .do(() => log("lambToComb time " + since()))
//   .map(combToJot)
//   .do(() => log("combToJot time " + since()))
//   .map(jotToFunc)
//   .do(() => log("jotToFunc time " + since()))
//   .map(funcAsNumber)
//   .do(() => log("funcAsNumber time " + since()))
//   .do(mn =>
//     mn.do(n => log("funcAsNumber succeeded: " + n)).elseDo(() => log("funcAsNumber failed"))
//   );

const TRUE_ = "(^f.^s.f)";
const FALSE_ = "(^f.^s.s)";
export const NOT = "(^b.^f.^s.((b s) f))";
export const AND = "(^ba.^bb.((ba bb) ba))";

export const IS_ZERO = `(^n.((n ^x.${m(FALSE_)}) ${m(TRUE_)}))`;
export const IS_LESS_OR_EQUAL = `(^m.^n.(${m(IS_ZERO)} ((${m(SUBTRACT)} m) n)))`;
export const IS_EQUAL = `(^m.^n.((${m(AND)} ((${m(IS_LESS_OR_EQUAL)} m) n)) ((${m(
  IS_LESS_OR_EQUAL
)} n) m)))`;

export const MINIMOD = `(^mod.^n.^q.((((${m(IS_LESS_OR_EQUAL)} n) q) ((mod ((${m(
  SUBTRACT
)} n) q)) q)) n))`;
export const MOD = `(${m(Y)} ${m(MINIMOD)})`;

export const MINIDIV = `(^div.^n.^q.((((${m(IS_LESS_OR_EQUAL)} n) q) (${m(INCREMENT)} ((div ((${m(
  SUBTRACT
)} n) q)) q))) ${m(ZERO)}))`;
export const DIV = `(${m(Y)} ${m(MINIDIV)})`;

// Pairs
export const PAIR = "(^a.^b.^f.((f a) b))";
export const FIRST = "(^p.(p ^a.^b.a))";
export const SECOND = "(^p.(p ^a.^b.b))";

const EMPTY_LIST = "(^c.^n.n)";
// const IS_EMPTY = `(^l.((l ^h.^t.${m(FALSE_)}) ${m(TRUE_)}))`;
export const CONS = "(^h.^t.^c.^n.((c h) ((t c) n)))";
export const HEAD = `(^l.((l ^h.^t.h) ${m(FALSE_)}))`;
export const TAIL = "(^l.^c.^n.(((l ^h.^t.^g.((g h) (t c))) ^t.n) ^h.^t.t))";

const FOLD_RIGHT = PAIR;
export const MAP = `(^f.((${m(FOLD_RIGHT)} ^x.(${m(CONS)} (f x))) ${m(EMPTY_LIST)}))`;

export const MINIRANGE = `(^range.^min.^max.((((${m(IS_LESS_OR_EQUAL)} min) max) ((${m(
  CONS
)} min) ((range (${m(INCREMENT)} min)) max))) ${m(EMPTY_LIST)}))`;
export const RANGE = `(${m(Y)} ${m(MINIRANGE)})`;
export const APPEND = `(${m(FOLD_RIGHT)} ${m(CONS)})`;
export const PUSH = `(^value.(${m(APPEND)} ((${m(CONS)} value) ${m(EMPTY_LIST)})))`;
// const REVERSE = `((${m(FOLD_RIGHT)} ${m(PUSH)}) ${m(EMPTY_LIST)})`;

const B_ = TEN;
const F_ = "(^x.^y.(x (x (x (x (x (x (x (x (x (x (x y))))))))))))"; // 11
const I_ = "(^x.^y.(x (x (x (x (x (x (x (x (x (x (x (x y)))))))))))))"; // 12
const U_ = "(^x.^y.(x (x (x (x (x (x (x (x (x (x (x (x (x y))))))))))))))"; // 13
const Z_ = "(^x.^y.(x (x (x (x (x (x (x (x (x (x (x (x (x (x y)))))))))))))))"; // 14
export const FIFTEEN = "(^x.^y.(x (x (x (x (x (x (x (x (x (x (x (x (x (x (x y))))))))))))))))";
export const HUNDRED =
  "(^x.^y.(x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x (x y)))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))";

const MINI_TO_DIGITS = `(^to_digits.^n.((${m(PUSH)} ((${m(MOD)} n) ${m(TEN)})) ((((${m(
  IS_LESS_OR_EQUAL
)} n) ${m(NINE)}) ${m(EMPTY_LIST)}) (to_digits ((${m(DIV)} n) ${m(TEN)})))))`;
const TO_DIGITS = `(${m(Y)} ${m(MINI_TO_DIGITS)})`;
const TO_STRING = TO_DIGITS;

export const YES = `((${m(CONS)} ${m(ZERO)}) ((${m(CONS)} ${m(ONE)}) ((${m(CONS)} ${m(TWO)}) ${m(
  EMPTY_LIST
)})))`;
// log(YES);
// lambDecoder
//   .decodeAny(YES)
//   .map(lambToComb)
//   .map(combToJot)
//   .map(jotToString)
//   .do(log);

export const FIZZ = `((${m(CONS)} ${m(F_)}) ((${m(CONS)} ${m(I_)}) ((${m(CONS)} ${m(Z_)}) ((${m(
  CONS
)} ${m(Z_)}) ${m(EMPTY_LIST)}))))`;

export const BUZZ = `((${m(CONS)} ${m(B_)}) ((${m(CONS)} ${m(U_)}) ((${m(CONS)} ${m(Z_)}) ((${m(
  CONS
)} ${m(Z_)}) ${m(EMPTY_LIST)}))))`;

export const FIZZBUZZ = `((${m(MAP)} ^num.(((${m(IS_ZERO)} ((${m(MOD)} num) ${m(FIFTEEN)})) ((${m(
  APPEND
)} ${m(BUZZ)}) ${m(FIZZ)})) (((${m(IS_ZERO)} ((${m(MOD)} num) ${m(THREE)})) ${m(FIZZ)}) (((${m(
  IS_ZERO
)} ((${m(MOD)} num) ${m(FIVE)})) ${m(BUZZ)}) (${m(TO_STRING)} num))))) ((${m(RANGE)} ${m(ONE)}) ${m(
  HUNDRED
)}))`;
