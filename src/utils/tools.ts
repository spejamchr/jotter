export const log = (...s: any[]) => console.log("[jotter]", ...s);
export const error = (...s: any[]) => console.error("[jotter]", ...s);

const DesiredChanceOfNoCollision = 1 - 1 / 10 ** 6;

const chanceOfNoCollision = (vars: number, chars: number, length: number): number => {
  const pool = chars ** length;
  let chance = 1;
  for (let i = 1; i < vars; i++) {
    chance *= 1 - i / pool;
  }
  return chance;
};

const requiredLength = (vars: number, chars: number) => {
  if (vars === 1) return 1;
  let length = 3;
  while (chanceOfNoCollision(vars, chars, length) < DesiredChanceOfNoCollision) length++;
  return length;
};

export const randWord = (vars?: number): string => {
  const len = requiredLength(vars || 10, 26);
  return Array(len)
    .fill(null)
    .map(() =>
      Math.random()
        .toString(36)
        .substr(2)
    )
    .join("")
    .replace(/[0-9]/g, "")
    .slice(0, len);
};

const multByTwo = (dec: string): string => {
  let newDec = "";
  let carry = 0;
  let nextCarry = 0;
  for (let i = dec.length - 1; i >= 0; i--) {
    const chr = dec[i];
    carry = nextCarry;
    nextCarry = Number(chr) > 4 ? 1 : 0;
    newDec = String(Number(chr) * 2 + carry).slice(-1) + newDec;
  }
  if (nextCarry) {
    newDec = String(nextCarry) + newDec;
  }
  return newDec;
};

const addOne = (dec: string): string => {
  if (dec.slice(-1) === "9") {
    return addOne(dec.slice(0, -1)) + "0";
  } else {
    return dec.slice(0, -1) + String(Number(dec.slice(-1)) + 1);
  }
};

export const binToDec = (bin: string): string => {
  if (!/^[01]*$/i.test(bin)) {
    return "";
  }
  let stack = "0";
  while (bin !== "") {
    stack = multByTwo(stack);
    if (bin[0] === "1") {
      stack = addOne(stack);
    }
    bin = bin.slice(1);
  }
  return stack;
};

export const assertNever = (a: never): never => {
  throw new Error(`received unexpected argument: ${a}`);
};

export const validParens = (value: string): boolean => {
  let i = 0;
  let g = 0;
  while (i < value.length) {
    if (value[i] === "(") g++;
    if (value[i] === ")") g--;
    if (g < 0) return false;
    i++;
  }
  return g === 0;
};

export const hasOuterParens = (expr: string): boolean => {
  if (expr[0] !== "(" || expr.slice(-1) !== ")") return false;

  let i = 1;
  let g = 1;
  while (i < expr.length - 1) {
    if (expr[i] === "(") g++;
    if (expr[i] === ")") g--;
    if (g === 0) return false;
    i++;
  }

  return true;
};
