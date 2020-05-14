import { FIZZBUZZ, NUM, Y } from "../lambExprs";
import { lambDecoder, lambToString, reduceLamb } from "../lamb";
import testFunctionWorks from "./testFunctionWorks";

const testLambDecoder = testFunctionWorks("lambDecoder & lambToString", (str: string) =>
  lambDecoder
    .decodeAny(str)
    .map(lambToString)
    .getOrElseValue("")
);

const testLambReducerWorks = testFunctionWorks("reduceLamb", (str: string) =>
  lambDecoder
    .decodeAny(str)
    .map(reduceLamb)
    .map(lambToString)
    .getOrElseValue("")
);

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
testLambDecoder("^x.x ^y.y ^x.x", "^a.a (^b.b (^c.c))");

testLambReducerWorks("(^x.x) (^x.x)", "^a.a");
testLambReducerWorks("(^x.^y.^z.x z (y z)) (^x.^y.x) (^x.^y.x)", "^a.a");
testLambReducerWorks(
  "(^x.^y.x (x (x y))) (^n.^x.^y.x (n x y)) (^x.^y.x (x y))",
  "^a.^b.a (a (a (a (a b))))"
);
testLambReducerWorks(Y, "^a.(^b.a (b b)) (^c.a (c c))");

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
  expect(ended - start).toBeLessThanOrEqual(50);
});

test("lambDecoder & lambToString are fast for big input", () => {
  const start = new Date().valueOf();
  lambDecoder
    .decodeAny(FIZZBUZZ)
    .map(lambToString)
    .getOrElseValue("");
  const ended = new Date().valueOf();
  expect(ended - start).toBeLessThanOrEqual(500);
});
