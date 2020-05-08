import { just, Maybe, nothing } from "maybeasy";
import { assertNever } from "./tools";

interface NotSet {
  kind: "not-set";
}

interface IsSet<T> {
  kind: "set";
  value: T;
}

interface OverSet<T> {
  kind: "over-set";
  values: T[];
}

type JustOnceState<T> = NotSet | IsSet<T> | OverSet<T>;

class JustOnce<T> {
  private state: JustOnceState<T> = { kind: "not-set" };

  kind = () => this.state.kind;

  value = (): Maybe<T> => {
    switch (this.state.kind) {
      case "not-set":
      case "over-set":
        return nothing();
      case "set":
        return just(this.state.value);
    }
  };

  set = (value: T) => {
    switch (this.state.kind) {
      case "not-set":
        this.state = { kind: "set", value };
        break;
      case "set":
        this.state = { kind: "over-set", values: [this.state.value, value] };
        break;
      case "over-set":
        this.state.values.push(value);
        break;
      default:
        assertNever(this.state);
    }
  };
}

export default JustOnce;
