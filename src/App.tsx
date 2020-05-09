import React, { useState } from "react";
import "./App.css";
import { combDecoder, combToJot, combToLamb, combToPrettyString } from "./utils/comb";
import { funcAsArray, funcAsBoolean, funcAsNumber, funcAsString } from "./utils/func";
import { jotFromString, jotToFunc, jotToLamb, jotToString } from "./utils/jot";
import { lambDecoder, lambToComb, lambToString, safeShort } from "./utils/lamb";
import { NUM } from "./utils/lambExprs";
import { binToDec, log } from "./utils/tools";

type Basis = "lamb" | "comb" | "jot";

log("NUM:");
log(safeShort(NUM));

function App() {
  const [basis, setBasis] = useState<Basis>("jot");
  const [rawLambStr, setRawLambStr] = useState("");
  const [rawCombStr, setRawCombStr] = useState("");
  const [rawJotStr, setRawJotStr] = useState("");

  const lambStr: string = ((): string => {
    switch (basis) {
      case "lamb":
        return rawLambStr;
      case "comb":
        return combDecoder
          .decodeAny(rawCombStr)
          .map(combToLamb)
          .map(lambToString)
          .getOrElseValue("");
      case "jot":
        return lambToString(jotToLamb(jotFromString(rawJotStr)));
    }
  })();

  const combStr: string = ((): string => {
    switch (basis) {
      case "lamb":
        return lambDecoder
          .decodeAny(rawLambStr)
          .map(lambToComb)
          .map(combToPrettyString)
          .getOrElseValue("");
      case "comb":
        return rawCombStr;
      case "jot":
        return combToPrettyString(lambToComb(jotToLamb(jotFromString(rawJotStr))));
    }
  })();

  const jotStr: string = ((): string => {
    switch (basis) {
      case "lamb":
        return lambDecoder
          .decodeAny(rawLambStr)
          .map(lambToComb)
          .map(combToJot)
          .map(jotToString)
          .getOrElseValue("");
      case "comb":
        return combDecoder
          .decodeAny(rawCombStr)
          .elseDo(console.error)
          .map(combToJot)
          .map(jotToString)
          .getOrElseValue("");
      case "jot":
        return rawJotStr;
    }
  })();

  const currentValueString = ((): string => {
    const emptyMsg = "...";
    switch (basis) {
      case "lamb":
        if (lambStr === "") return emptyMsg;
        return lambDecoder
          .decodeAny(lambStr)
          .map(lambToString)
          .getOrElseValue("Invalid Lambda Expression");
      case "comb":
        if (combStr === "") return emptyMsg;
        return combDecoder
          .decodeAny(combStr)
          .map(combToPrettyString)
          .getOrElseValue("Invalid Combinatory Expression");
      case "jot":
        return emptyMsg;
    }
  })();

  const func = jotToFunc(jotFromString(jotStr));

  return (
    <div className="App">
      <header className="App-header">
        {currentValueString}
        <table style={{ width: "90%" }}>
          <tbody>
            <tr>
              <td style={{ width: "20%" }}>Lambda Expression </td>
              <td style={{ width: "60%" }}>
                <input
                  style={{ width: "100%" }}
                  value={lambStr}
                  onChange={e => {
                    setRawLambStr(e.target.value);
                    setBasis("lamb");
                  }}
                />
              </td>
              <td style={{ width: "20%" }}>(length: {lambStr.length})</td>
            </tr>

            <tr>
              <td>Combinatory Logic</td>
              <td>
                <input
                  style={{ width: "100%" }}
                  value={combStr}
                  onChange={e => {
                    setRawCombStr(e.target.value);
                    setBasis("comb");
                  }}
                />
              </td>
              <td>(length: {combStr.length})</td>
            </tr>

            <tr>
              <td>Jot </td>
              <td>
                <input
                  style={{ width: "100%" }}
                  value={jotStr}
                  onChange={e => {
                    setRawJotStr(jotToString(jotFromString(e.target.value)));
                    setBasis("jot");
                  }}
                />
              </td>
              <td>(length: {jotStr.length})</td>
            </tr>

            <tr>
              <td>Decimal Jot </td>
              <td>
                <input
                  style={{ width: "100%" }}
                  value={jotStr ? (jotStr.length < 1000 ? binToDec(jotStr) : "Pretty big") : ""}
                  disabled
                />
              </td>
              <td>{jotStr.length < 1000 ? `(length: ${binToDec(jotStr).length})` : ""}</td>
            </tr>
          </tbody>
        </table>

        <p>As boolean:</p>
        <code>
          {funcAsBoolean(func)
            .map(String)
            .getOrElseValue("not a boolean")}
        </code>
        <p>As number:</p>
        <code>
          N:{" "}
          {funcAsNumber(func)
            .map(String)
            .getOrElseValue("not a number")}
        </code>
        <p>As string:</p>
        <code>
          S:{" "}
          {funcAsString(func)
            .map(JSON.stringify)
            .map(s => (s.length < 40 ? s : `${s.slice(0, 40)}...`))
            .getOrElseValue("not a string")}
        </code>
        <p>As array of numbers:</p>
        <code>
          A:{" "}
          {funcAsArray(func)
            .map(a => a.map(funcAsNumber).map(mn => mn.map(String).getOrElseValue("not a number")))
            .map(a => (a.length < 20 ? a : a.slice(0, 20).concat(["..."])))
            .map(a => `[ ${a.join(", ")} ]`)
            .getOrElseValue("not an array")}
        </code>
      </header>
    </div>
  );
}

export default App;
