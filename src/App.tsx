import React, { useState } from "react";
import "./App.css";
import {
  binToDec,
  combDecoder,
  combToJot,
  combToLamb,
  combToString,
  decToBin,
  funcAsArray,
  funcAsBoolean,
  funcAsNumber,
  funcAsString,
  jotFromString,
  jotToFunc,
  jotToLamb,
  jotToString,
  lambDecoder,
  lambToComb,
  lambToString
} from "./utils/jot";

type Basis = "lamb" | "comb" | "jot";

function App() {
  const [basis, setBasis] = useState<Basis>("lamb");
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
          .elseDo(console.error)
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
          .elseDo(console.error)
          .map(lambToComb)
          .map(combToString)
          .getOrElseValue("");
      case "comb":
        return rawCombStr;
      case "jot":
        return combToString(lambToComb(jotToLamb(jotFromString(rawJotStr))));
    }
  })();

  const jotStr: string = ((): string => {
    switch (basis) {
      case "lamb":
        return lambDecoder
          .decodeAny(rawLambStr)
          .elseDo(console.error)
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

  const func = jotToFunc(jotFromString(jotStr));

  return (
    <div className="App">
      <header className="App-header">
        <table style={{width: '90%'}}>
          <tbody>
            <tr>
              <td style={{width: '20%'}}>Lambda Expression </td>
              <td style={{width: '60%'}}>
                <input
                  style={{ width: "100%" }}
                  value={lambStr}
                  onChange={e => {
                    setRawLambStr(e.target.value);
                    setBasis("lamb");
                  }}
                />
              </td>
              <td style={{width: '20%'}}>(length: {lambStr.length})</td>
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
                  value={jotStr ? binToDec(jotStr) : ''}
                  onChange={e => {
                    setRawJotStr(decToBin(e.target.value));
                    setBasis("jot");
                  }}
                />
              </td>
              <td>(length: {binToDec(jotStr).length})</td>
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
        <code>S: {JSON.stringify(funcAsString(func))}</code>
        <p>As array of numbers:</p>
        <code>
          A:{" "}
          {funcAsArray(func)
            .map(funcAsNumber)
            .map(mn => mn.map(String).getOrElseValue("not a number"))
            .join(", ")}
        </code>
        <p>As array of strings:</p>
        <code>
          A:{" "}
          {funcAsArray(func)
            .map(funcAsString)
            .map(s => JSON.stringify(s))}
        </code>
      </header>
    </div>
  );
}

export default App;
