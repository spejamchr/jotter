import { combDecoder, combToPrettyString, reduceComb } from "../comb";
import { NUM, FIZZBUZZ, Y } from "../lambExprs";
import { lambToComb, lambDecoder } from "../lamb";

const testCombDecoder = (tryStr: string, expected: string) => {
  test(`[combDecoder & combToPrettyString] ${tryStr} -> ${expected}`, () => {
    expect(
      combDecoder
        .decodeAny(tryStr)
        .map(combToPrettyString)
        .getOrElseValue("")
    ).toEqual(expected);
  });
};

const testCombReducerWorks = (tryStr: string, expected: string) => {
  test(`[reduceComb] ${tryStr} -> ${expected}`, () => {
    expect(
      combDecoder
        .decodeAny(tryStr)
        .map(reduceComb)
        .map(combToPrettyString)
        .getOrElseValue("")
    ).toEqual(expected);
  });
};

testCombDecoder("I", "I");
testCombDecoder("IS", "IS");
testCombDecoder("I S", "IS");
testCombDecoder("(I S)", "IS");
testCombDecoder("(S(K(K)))", "S(KK)");
testCombDecoder("(((S)K)K)", "SKK");
testCombDecoder("(  ((S ) K)K  )", "SKK");

testCombReducerWorks("I", "I");
testCombReducerWorks("IS", "S");
testCombReducerWorks("SKK", "I");
testCombReducerWorks("SK(S(SS)S)", "I");
testCombReducerWorks("SK(S(SS)S)K", "K");
testCombReducerWorks("SSISISIS", "S(SS)S");

const getCombStr = (lambStr: string): string =>
  lambDecoder
    .decodeAny(lambStr)
    .map(lambToComb)
    .map(combToPrettyString)
    .elseDo(fail)
    .getOrElseValue("");

test("combDecoder & combToPrettyString are fast for small input", () => {
  const start = new Date().valueOf();
  combDecoder
    .decodeAny("S(SS)S")
    .map(combToPrettyString)
    .getOrElseValue("");
  const ended = new Date().valueOf();
  expect(ended - start).toBeLessThanOrEqual(1);
});

test("combDecoder & combToPrettyString are fast for medium input", () => {
  const combStr = getCombStr(Y);
  const start = new Date().valueOf();
  combDecoder
    .decodeAny(combStr)
    .map(combToPrettyString)
    .getOrElseValue("");
  const ended = new Date().valueOf();
  expect(ended - start).toBeLessThanOrEqual(10);
});

test("combDecoder & combToPrettyString are fast for big input", () => {
  const combStr = getCombStr(NUM);
  const start = new Date().valueOf();
  combDecoder
    .decodeAny(combStr)
    .map(combToPrettyString)
    .getOrElseValue("");
  const ended = new Date().valueOf();
  expect(ended - start).toBeLessThanOrEqual(400);
});
