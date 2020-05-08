import { just, Maybe, nothing } from "maybeasy";
import JustOnce from "./justOnce";

export type Func = (a: Func) => Func;

export const effect = (e: (func: Func) => void, f?: Func): Func => arg => {
  f = f || (x => x);
  e(arg);
  return f(arg);
};

export const funcAsBoolean = (func: Func): Maybe<boolean> => {
  const bool = new JustOnce<boolean>();
  func(effect(() => bool.set(true)))(effect(() => bool.set(false)))(x => x);
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

export const funcAsArray = (func: Func): Maybe<Func[]> => {
  let a: Func[] = [];
  let valid = true;

  const tester = effect(f => {
    if (f !== tester) {
      valid = false;
    }
  });

  func(
    effect(
      f => a.push(f),
      _ => tester
    )
  )(tester);

  return valid ? just(a) : nothing();
};

export const funcAsString = (func: Func): Maybe<string> =>
  funcAsArray(func).map(a =>
    a
      .map(funcAsNumber)
      .map(mi => mi.map(String.fromCodePoint).getOrElseValue("�"))
      .join("")
  );
