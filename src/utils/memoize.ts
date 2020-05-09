const memoize = <T>(f: () => T): (() => T) => {
  let value: T | undefined = undefined;
  return () => {
    if (!value) value = f();
    return value;
  };
};

export default memoize;
