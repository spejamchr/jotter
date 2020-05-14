const testFunctionWorks = <A, R>(name: string, f: (a: A) => R) => (tryArg: A, expectedReturn: R) =>
  test(`[${name}] ${JSON.stringify(tryArg)} -> ${JSON.stringify(expectedReturn)}`, () =>
    expect(f(tryArg)).toEqual(expectedReturn));

export default testFunctionWorks;
