import React, { useState } from "react";
import "./App.css";
import BasisMachine, { BasisKind } from "./utils/BasisMachine";
import { funcAsArray, funcAsBoolean, funcAsNumber, funcAsString } from "./utils/func";
import { jotToFunc } from "./utils/jot";
import { safeShort } from "./utils/lamb";
import { NUM } from "./utils/lambExprs";
import { log } from "./utils/tools";

log("NUM:");
log(safeShort(NUM));

function App() {
  const [basis, rawSetBasis] = useState(new BasisMachine("jot", ""));

  const setBasis = (kind: BasisKind) => (e: React.ChangeEvent<HTMLInputElement>) => {
    rawSetBasis(new BasisMachine(kind, e.target.value));
  };

  const func = jotToFunc(basis.jot());

  return (
    <div className="App">
      <header className="App-header">
        <p>{basis.currentValue()}</p>
        <table style={{ width: "90%" }}>
          <tbody>
            <tr>
              <td style={{ width: "20%" }}>Lambda Expression </td>
              <td style={{ width: "60%" }}>
                <input
                  style={{ width: "100%" }}
                  value={basis.lambStr()}
                  onChange={setBasis("lamb")}
                />
              </td>
              <td style={{ width: "20%" }}>(length: {basis.lambStr().length})</td>
            </tr>

            <tr>
              <td>Combinatory Logic</td>
              <td>
                <input
                  style={{ width: "100%" }}
                  value={basis.combStr()}
                  onChange={setBasis("comb")}
                />
              </td>
              <td>(length: {basis.combStr().length})</td>
            </tr>

            <tr>
              <td>Jot </td>
              <td>
                <input
                  style={{ width: "100%" }}
                  value={basis.jotStr()}
                  onChange={setBasis("jot")}
                />
              </td>
              <td>(length: {basis.jotStr().length})</td>
            </tr>

            <tr>
              <td>Decimal Jot </td>
              <td>
                <input
                  style={{ width: "100%" }}
                  value={basis.decStr().getOrElseValue("Biggish number")}
                  disabled
                />
              </td>
              <td>
                {basis
                  .decStr()
                  .map(s => `(length: ${s.length})`)
                  .getOrElseValue("")}
              </td>
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
