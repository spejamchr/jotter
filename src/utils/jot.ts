import Decoder from "jsonous";
import { err, ok } from "resulty";
import { Func } from "./func";
import { labstraction, Lamb, lapplication, lvariable } from "./lamb";
import { randWord } from "./tools";

export type Jot = (0 | 1)[];

const S: Func = x => y => z => x(z)(y(z));
const K: Func = x => _ => x;
const I: Func = x => x;

const J1: Func = v => f => a => v(f(a));

export const jotToFunc = (program: Jot): Func => program.reduce((v, b) => (b ? J1(v) : v(S)(K)), I);

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

const ILamb = (len: number): Lamb => {
  const vari = lvariable(randWord(len));
  return { kind: "labstraction", vari, body: vari };
};

const J1Lamb = (l: Lamb, len: number): Lamb => {
  const f = lvariable(randWord(len));
  const a = lvariable(randWord(len));
  return labstraction(f, labstraction(a, lapplication(l, lapplication(f, a))));
};

const SLamb = (len: number): Lamb => {
  const x = lvariable(randWord(len));
  const y = lvariable(randWord(len));
  const z = lvariable(randWord(len));
  return labstraction(
    x,
    labstraction(y, labstraction(z, lapplication(lapplication(x, z), lapplication(y, z))))
  );
};

const KLamb = (len: number): Lamb => {
  const x = lvariable(randWord(len));
  const y = lvariable(randWord(len));
  return labstraction(x, labstraction(y, x));
};

const J0Lamb = (l: Lamb, len: number): Lamb =>
  lapplication(lapplication(l, SLamb(len)), KLamb(len));

export const jotToLamb = (jot: Jot): Lamb => {
  const len = jot.length;
  return jot.reduce((l, j) => (j === 1 ? J1Lamb(l, len) : J0Lamb(l, len)), ILamb(len));
};
