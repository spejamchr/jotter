import Decoder from "jsonous";
import { just, Maybe, nothing } from "maybeasy";
import { err, ok, Result } from "resulty";
import { Jot, jotFromString } from "./jot";
import { Lamb, lambDecoder, lvariable } from "./lamb";
import { hasOuterParens, randWord, validParens } from "./tools";

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
const pairComb = (expr: string): string => {
  if (hasOuterParens(expr)) {
    expr = expr.slice(1, -1);
  }
  let groups = findGroups(expr);
  if (groups.length > 1) {
    groups = groups.map(pairComb);
  }
  return groups.reduce((s, g, i) => (i === 0 ? g : `(${s} ${g})`), "");
};

const splitIndex = (pair: string): number => {
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

export const combDecoder: Decoder<Comb> = new Decoder((value: any) => {
  if (typeof value !== "string") {
    const errorMsg = `I expected to find a string but instead I found ${JSON.stringify(value)}`;
    return err(errorMsg);
  }
  if (!validParens(value)) {
    return err(`Unmatched paren(s) in ${value}`);
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

const SJot = "11111000";
const KJot = "11100";
const IJot = "11010";

const combToJotString = (comb: Comb): string => {
  switch (comb.kind) {
    case "combinator":
      return comb.value === "S" ? SJot : comb.value === "K" ? KJot : IJot;
    case "capplication":
      return `1${combToJotString(comb.first)}${combToJotString(comb.second)}`;
  }
};

export const combToJot = (comb: Comb): Jot => jotFromString(combToJotString(comb));

const combinatorToLamb = (comb: Combinator, coms: number): Lamb => {
  const x = randWord(coms);
  const y = randWord(coms);
  const z = randWord(coms);
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

export const combToLamb = (comb: Comb, coms?: number): Lamb => {
  coms = coms || combToPrettyString(comb).length;
  switch (comb.kind) {
    case "combinator":
      return combinatorToLamb(comb, coms);
    case "capplication":
      return {
        kind: "lapplication",
        first: combToLamb(comb.first, coms),
        second: combToLamb(comb.second, coms)
      };
  }
};
