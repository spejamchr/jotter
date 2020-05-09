import { just, Maybe, nothing } from "maybeasy";
import { ok, Result } from "resulty";
import { Comb, combDecoder, combToJot, combToLamb, combToPrettyString } from "./comb";
import { Jot, jotFromString, jotToLamb, jotToString } from "./jot";
import { Lamb, lambDecoder, lambToComb, lambToString } from "./lamb";
import memoize from "./memoize";
import { binToDec, error } from "./tools";

interface BaseBasis {
  string: string;
}

interface LambBasis extends BaseBasis {
  kind: "lamb";
}

interface CombBasis extends BaseBasis {
  kind: "comb";
}

interface JotBasis extends BaseBasis {
  kind: "jot";
}

type Basis = LambBasis | CombBasis | JotBasis;

export type BasisKind = Basis["kind"];

class BasisMachine {
  private state: Basis;

  constructor(kind: BasisKind, string: string) {
    this.state = {
      kind,
      string
    };
  }

  lamb = memoize(
    (): Result<string, Lamb> => {
      switch (this.state.kind) {
        case "lamb":
          return lambDecoder.decodeAny(this.state.string).elseDo(error);
        case "comb":
          return this.comb().map(combToLamb);
        case "jot":
          return ok(jotToLamb(this.jot()));
      }
    }
  );

  comb = memoize(
    (): Result<string, Comb> => {
      switch (this.state.kind) {
        case "lamb":
        case "jot":
          return this.lamb().map(lambToComb);
        case "comb":
          return combDecoder.decodeAny(this.state.string).elseDo(error);
      }
    }
  );

  jot = memoize(
    (): Jot => {
      switch (this.state.kind) {
        case "lamb":
        case "comb":
          return this.comb()
            .map(combToJot)
            .getOrElseValue([]);
        case "jot":
          return jotFromString(this.state.string);
      }
    }
  );

  lambStr = memoize((): string => {
    switch (this.state.kind) {
      case "lamb":
        return this.state.string;
      case "comb":
      case "jot":
        return this.lamb()
          .map(lambToString)
          .getOrElseValue("");
    }
  });

  combStr = memoize((): string => {
    switch (this.state.kind) {
      case "comb":
        return this.state.string;
      case "lamb":
      case "jot":
        return this.comb()
          .map(combToPrettyString)
          .getOrElseValue("");
    }
  });

  jotStr = memoize((): string => {
    switch (this.state.kind) {
      case "lamb":
      case "comb":
        return jotToString(this.jot());
      case "jot":
        return this.state.string;
    }
  });

  currentValue = memoize((): string => {
    switch (this.state.kind) {
      case "lamb":
        return this.lamb()
          .map(lambToString)
          .getOrElseValue("Invalid Lambda Expression");
      case "comb":
        return this.comb()
          .map(combToPrettyString)
          .getOrElseValue("Invalid Combinatory Expression");
      case "jot":
        return "...";
    }
  });

  decStr = memoize(
    (): Maybe<string> => (this.jotStr().length < 1000 ? just(binToDec(this.jotStr())) : nothing())
  );
}

export default BasisMachine;
