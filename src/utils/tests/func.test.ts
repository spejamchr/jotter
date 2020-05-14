import BasisMachine from "../BasisMachine";
import { funcAsArray, funcAsNumber } from "../func";
import { jotToFunc } from "../jot";
import {
  CONS,
  EMPTY_LIST,
  FIVE,
  INCREMENT,
  IS_LESS_OR_EQUAL,
  MOD,
  ONE,
  SEVEN,
  SIX,
  SUBTRACT,
  THREE,
  TWO,
  ZERO
} from "../lambExprs";

const lambToNumber = (str: string): string =>
  funcAsNumber(jotToFunc(new BasisMachine("lamb", str).jot()))
    .map(String)
    .getOrElseValue("funcAsNumber returned nothing");

const lambToNumberArray = (str: string): string =>
  funcAsArray(jotToFunc(new BasisMachine("lamb", str).jot()))
    .map(a =>
      a.map(funcAsNumber).map(mn => mn.map(String).getOrElseValue("funcAsNumber returned nothing"))
    )
    .map(a => `[ ${a.join(", ")} ]`)
    .getOrElseValue("funcAsArray returned nothing");

test("[funcAsNumber] interpret zero", () => {
  expect(lambToNumber(ZERO)).toEqual("0");
});

test("[funcAsNumber] interpret simple number", () => {
  expect(lambToNumber(SIX)).toEqual("6");
});

test("[funcAsNumber] interpret non-reduced", () => {
  expect(lambToNumber(`${TWO} ${TWO} ${SIX}`)).toEqual("1296");
});

test("[funcAsNumber] interpret increment", () => {
  expect(lambToNumber(`${INCREMENT} ${FIVE}`)).toEqual("6");
});

test("[funcAsNumber] interpret subtract", () => {
  expect(lambToNumber(`${SUBTRACT} ${FIVE} ${THREE}`)).toEqual("2");
});

test("[funcAsNumber] interpret if/else statement", () => {
  expect(lambToNumber(`${IS_LESS_OR_EQUAL} ${SEVEN} ${THREE} ${SEVEN} ${THREE}`)).toEqual("3");
});

// Recursion with the Y and Z combinators gives an infinite loop :/
// test("[funcAsNumber] interpret mod", () => {
//   expect(lambToNumber(`((${MOD} ${THREE}) ${TWO})`)).toEqual("1");
// });

test("[funcAsArray] interpret empty array", () => {
  expect(lambToNumberArray(EMPTY_LIST)).toEqual("[  ]");
});

test("[funcAsArray] interpret simple array", () => {
  expect(
    lambToNumberArray(`${CONS} ${ZERO} (${CONS} ${ONE} (${CONS} ${TWO} ${EMPTY_LIST}))`)
  ).toEqual("[ 0, 1, 2 ]");
});
