import BasisMachine from "../BasisMachine";

test("[BasisMachine] lamb identity", () => {
  const bm = new BasisMachine("lamb", "^thing.thing");
  expect(bm.lambStr()).toEqual("^thing.thing");
  expect(bm.combStr()).toEqual("I");
  expect(bm.jotStr()).toEqual("11010");
  expect(bm.decStr().getOrElseValue("")).toEqual("26");
  expect(bm.currentValue()).toEqual("^a.a");
});

test("[BasisMachine] lamb simplifies to identity", () => {
  const bm = new BasisMachine("lamb", "(^x.^y.x) (^x.x) ((^x.^y.x) (^x.x))");
  expect(bm.lambStr()).toEqual("(^x.^y.x) (^x.x) ((^x.^y.x) (^x.x))");
  expect(bm.combStr()).toEqual("I");
  expect(bm.jotStr()).toEqual("11010");
  expect(bm.decStr().getOrElseValue("")).toEqual("26");
  expect(bm.currentValue()).toEqual("^a.a");
});

test("[BasisMachine] comb identity", () => {
  const bm = new BasisMachine("comb", "I");
  expect(bm.lambStr()).toEqual("^a.a");
  expect(bm.combStr()).toEqual("I");
  expect(bm.jotStr()).toEqual("11010");
  expect(bm.decStr().getOrElseValue("")).toEqual("26");
  expect(bm.currentValue()).toEqual("I");
});

test("[BasisMachine] comb simplifies to identity", () => {
  const bm = new BasisMachine("comb", "SKK");
  expect(bm.lambStr()).toEqual("^a.a");
  expect(bm.combStr()).toEqual("SKK");
  expect(bm.jotStr()).toEqual("11010");
  expect(bm.decStr().getOrElseValue("")).toEqual("26");
  expect(bm.currentValue()).toEqual("I");
});

test("[BasisMachine] jot identity", () => {
  const bm = new BasisMachine("jot", "11010");
  expect(bm.lambStr()).toEqual("^a.a");
  expect(bm.combStr()).toEqual("I");
  expect(bm.jotStr()).toEqual("11010");
  expect(bm.decStr().getOrElseValue("")).toEqual("26");
  expect(bm.currentValue()).toEqual("...");
});

test("[BasisMachine] lamb reduces correctly with alpha substitution", () => {
  const bm = new BasisMachine("lamb", "((^x.(x (^y.(x y y)))) (^z.^w.z (z w))) (^a.^b.b)");
  expect(bm.lambStr()).toEqual("((^x.(x (^y.(x y y)))) (^z.^w.z (z w))) (^a.^b.b)");
  expect(bm.combStr()).toEqual("I");
  expect(bm.jotStr()).toEqual("11010");
  expect(bm.decStr().getOrElseValue("")).toEqual("26");
  expect(bm.currentValue()).toEqual("^a.a");
});
