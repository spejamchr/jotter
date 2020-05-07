import React, { useState } from "react";
import "./App.css";
import {
  combDecoder,
  combToJot,
  combToLamb,
  combToString,
  funcAsArray,
  funcAsBoolean,
  funcAsNumber,
  funcAsString,
  jotToFunc,
  jotToString,
  lambDecoder,
  lambToComb,
  lambToString,
  jotDecoder,
  jotToLamb
} from "./utils/jot";

type Basis = "lamb" | "comb" | "jot";

function App() {
  const [basis, setBasis] = useState<Basis>("lamb");
  const [lambStr, setLambStr] = useState("");
  const [combStr, setCombStr] = useState("");
  const [jotStr, setJotStr] = useState("");

  const getLambStr = (): string => {
    switch (basis) {
      case "lamb":
        return lambStr;
      case "comb":
        return combDecoder
          .decodeAny(combStr)
          .elseDo(console.error)
          .map(combToLamb)
          .map(lambToString)
          .getOrElseValue("");
      case "jot":
        return jotDecoder
          .decodeAny(jotStr)
          .elseDo(console.error)
          .map(jotToLamb)
          .map(lambToString)
          .getOrElseValue("");
    }
  };

  const getCombStr = (): string => {
    switch (basis) {
      case "lamb":
        return lambDecoder
          .decodeAny(lambStr)
          .elseDo(console.error)
          .map(lambToComb)
          .map(combToString)
          .getOrElseValue("");
      case "comb":
        return combStr;
      case "jot":
        return jotDecoder
          .decodeAny(jotStr)
          .elseDo(console.error)
          .map(jotToLamb)
          .map(lambToComb)
          .map(combToString)
          .getOrElseValue("");
    }
  };

  const getJotStr = (): string => {
    switch (basis) {
      case "lamb":
        return lambDecoder
          .decodeAny(lambStr)
          .elseDo(console.error)
          .map(lambToComb)
          .map(combToJot)
          .map(jotToString)
          .getOrElseValue("");
      case "comb":
        return combDecoder
          .decodeAny(combStr)
          .elseDo(console.error)
          .map(combToJot)
          .map(jotToString)
          .getOrElseValue("");
      case "jot":
        return jotStr;
    }
  };

  const func = jotDecoder.decodeAny(getJotStr()).map(jotToFunc);

  return (
    <div className="App">
      <header className="App-header">
        <input
          style={{ width: "50%" }}
          value={getLambStr()}
          onChange={e => {
            setLambStr(e.target.value);
            setBasis("lamb");
          }}
        />
        <input
          style={{ width: "50%" }}
          value={getCombStr()}
          onChange={e => {
            setCombStr(e.target.value);
            setBasis("comb");
          }}
        />
        <input
          style={{ width: "50%" }}
          value={getJotStr()}
          onChange={e => {
            setJotStr(e.target.value);
            setBasis("jot");
          }}
        />
        <input
          style={{ width: "50%" }}
          type="number"
          value={parseInt(getJotStr(), 2)}
          onChange={e => {
            setJotStr(parseInt(e.target.value).toString(2));
            setBasis("jot");
          }}
        />
        <p>As boolean:</p>
        <code>
          {func
            .map(funcAsBoolean)
            .map(mb => mb.map(String).getOrElseValue("not a boolean"))
            .getOrElseValue("broke")}
        </code>
        <p>As number:</p>
        <code>
          N:{" "}
          {func
            .map(funcAsNumber)
            .map(mn => mn.map(String).getOrElseValue("not a number"))
            .getOrElseValue("broke")}
        </code>
        <p>As string:</p>
        <code>
          S:{" "}
          {func
            .map(funcAsString)
            .map(JSON.stringify)
            .getOrElseValue("broke")}
        </code>
        <p>As array of numbers:</p>
        <code>
          A:{" "}
          {func
            .map(funcAsArray)
            .map(a =>
              a
                .map(funcAsNumber)
                .map(mn => mn.map(String).getOrElseValue("not a number"))
                .join(", ")
            )
            .map(s => `[${s}]`)
            .getOrElseValue("broke")}
        </code>
        <p>As array of strings:</p>
        <code>
          A:{" "}
          {func
            .map(funcAsArray)
            .map(a => a.map(funcAsString))
            .map(JSON.stringify)
            .getOrElseValue("broke")}
        </code>
      </header>
    </div>
  );
}

export default App;
