import { FIZZBUZZ, NUM, Y } from "../lambExprs";
import { lambDecoder, lambToString, reduceLamb } from "../lamb";

const testLambDecoder = (tryStr: string, expected: string) => {
  test(`[lambDecoder & lambToString] ${tryStr} -> ${expected}`, () => {
    expect(
      lambDecoder
        .decodeAny(tryStr)
        .map(lambToString)
        .getOrElseValue("")
    ).toEqual(expected);
  });
};

const testLambReducerWorks = (tryStr: string, expected: string) => {
  test(`[reduceLamb] ${tryStr} -> ${expected}`, () => {
    expect(
      lambDecoder
        .decodeAny(tryStr)
        .map(reduceLamb)
        .map(lambToString)
        .getOrElseValue("")
    ).toEqual(expected);
  });
};

testLambDecoder("^a.a", "^a.a");
testLambDecoder("^x.x", "^a.a");
testLambDecoder("^x.x x", "^a.a a");
testLambDecoder("^x.(x x)", "^a.a a");
testLambDecoder("(^x.x x)", "^a.a a");
testLambDecoder("^x.(x ^y.x)", "^a.a (^b.a)");
testLambDecoder("^x.^y.x", "^a.^b.a");
testLambDecoder("^x.^y.(x (x (x y)))", "^a.^b.a (a (a b))");
testLambDecoder(Y, "^a.(^b.a (b b)) (^c.a (c c))");
testLambDecoder("(^x.x) (^x.x)", "((^a.a) (^b.b))");
testLambDecoder("((^x.x) (^x.x))", "((^a.a) (^b.b))");

testLambReducerWorks("(^x.x) (^x.x)", "^a.a");
testLambReducerWorks("(^x.^y.^z.x z (y z)) (^x.^y.x) (^x.^y.x)", "^a.a");
testLambReducerWorks(
  "(^x.^y.x (x (x y))) (^n.^x.^y.x (n x y)) (^x.^y.x (x y))",
  "^a.^b.a (a (a (a (a b))))"
);

test("lambDecoder & lambToString are fast for small input", () => {
  const start = new Date().valueOf();
  lambDecoder
    .decodeAny(Y)
    .map(lambToString)
    .getOrElseValue("");
  const ended = new Date().valueOf();
  expect(ended - start).toBeLessThanOrEqual(1);
});

test("lambDecoder & lambToString are fast for medium input", () => {
  const start = new Date().valueOf();
  lambDecoder
    .decodeAny(NUM)
    .map(lambToString)
    .getOrElseValue("");
  const ended = new Date().valueOf();
  expect(ended - start).toBeLessThanOrEqual(30);
});

test("lambDecoder & lambToString are fast for big input", () => {
  const start = new Date().valueOf();
  lambDecoder
    .decodeAny(FIZZBUZZ)
    .map(lambToString)
    .getOrElseValue("");
  const ended = new Date().valueOf();
  expect(ended - start).toBeLessThanOrEqual(400);
});
