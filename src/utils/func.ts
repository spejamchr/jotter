import { just, Maybe, nothing } from "maybeasy";
import { error } from "./tools";
import JustOnce from "./justOnce";

export type Func = (a: Func) => Func;

export const effect = (e: (func: Func) => void, f?: Func): Func => arg => {
  f = f || (x => x);
  e(arg);
  return f(arg);
};

export const funcAsBoolean = (func: Func): Maybe<boolean> => {
  const bool = new JustOnce<boolean>();
  const i: Func = x => x;
  let valid = true;
  try {
    func(effect(f => (f === i ? bool.set(true) : (valid = false))))(
      effect(f => (f === i ? bool.set(false) : (valid = false)))
    )(i);
  } catch (e) {
    error("Infinite loop?", e);
    return nothing();
  }
  if (!valid) return nothing();

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
  try {
    func(
      effect(f => {
        n += 1;
        if (f !== notNumber) {
          valid = false;
        }
      })
    )(notNumber);
  } catch (e) {
    error("Infinite loop?", e);
    return nothing();
  }
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

  try {
    func(
      effect(
        f => a.push(f),
        _ => tester
      )
    )(tester);
  } catch (e) {
    error("Infinite loop?", e);
    return nothing();
  }
  return valid ? just(a) : nothing();
};

export const funcAsString = (func: Func): Maybe<string> =>
  funcAsArray(func).map(a =>
    a
      .map(funcAsNumber)
      .map(mi => mi.map(String.fromCodePoint).getOrElseValue("�"))
      .join("")
  );
