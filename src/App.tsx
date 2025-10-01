import { useEffect, useMemo, useState } from "react";
import RouletteBoard from "./components/RouletteBoard";
import RouletteWheel from "./components/RouletteWheel";
import { useLocalStorage } from "./hooks/useLocalStorage";

import { numberColor, SIMPLE_CHANCE_PREDICATE, nextBetForSimpleChance, calcParoliSaldo } from "./roulette";

type View = "board" | "wheel";
type SimpleChances = {
  low: boolean; // 1–18
  even: boolean;
  red: boolean;
  black: boolean;
  odd: boolean;
  high: boolean; // 19–36
};

export default function App() {
  // Geworfene Zahlen (in Reihenfolge)
  const [throws, setThrows] = useState<number[]>([]);
  const [view, setView] = useState<View>("board");

  // Einsatz/Kapital
const [einsatz, setEinsatz] = useLocalStorage<number>("einsatz", 10);
const [kapital, setKapital] = useLocalStorage<number>("saldo", 1000);

  // Einfache Chancen: Standard aktiv: Schwarz, Gerade, 19–36
  const [chances, setChances] = useState<SimpleChances>({
    low: false,
    even: true,
    red: false,
    black: true,
    odd: false,
    high: true,
  });

  // Klick auf Board/Wheel fügt eine neue geworfene Zahl hinzu
  const addThrow = (n: number) => setThrows((prev) => [...prev, n]);
  const undoLast = () => setThrows((prev) => prev.slice(0, -1));

  const toggleChance = (key: keyof SimpleChances) => setChances((c) => ({ ...c, [key]: !c[key] }));

  const parseNumber = (v: string, fallback: number) => {
    const n = Number(v.replace(",", "."));
    return Number.isFinite(n) ? n : fallback;
  };

  // System-Berechnung für alle aktivierten einfachen Chancen
  const systemNextBets = useMemo(() => {
    const result: Array<{
      key: keyof SimpleChances;
      label: string;
      nextStake: number;
      inRecovery: boolean;
      winStreak: number;
    }> = [];

    const labels: Record<keyof SimpleChances, string> = {
      low: "1–18",
      even: "Gerade",
      red: "Rot",
      black: "Schwarz",
      odd: "Ungerade",
      high: "19–36",
    };

    (Object.keys(chances) as (keyof SimpleChances)[]).forEach((key) => {
      if (!chances[key]) return;
      const pred = SIMPLE_CHANCE_PREDICATE[key];
      const info = nextBetForSimpleChance(throws, einsatz, pred);
      result.push({ key, label: labels[key], ...info });
    });
    return result;
  }, [chances, throws, einsatz]);

  // aktive einfachen Chancen sammeln
  const activeChanceKeys = useMemo(() => (Object.keys(chances) as (keyof SimpleChances)[]).filter((k) => chances[k]), [chances]);

  // Nettogewinn laut Paroli-System über alle Würfe + Startkapital
  // const saldo = useMemo(() => {
  //   const profit = calcParoliSaldo(
  //     throws,
  //     einsatz,
  //     activeChanceKeys as any // gleiche Keys wie SimpleChanceKey
  //   );
  //   return kapital + profit;
  // }, [throws, einsatz, kapital, activeChanceKeys]);

  // PERSISTENT: aktueller Saldo
  const [saldo, setSaldo] = useLocalStorage<number>("saldo", kapital);

// Saldo immer aktuell halten (und damit automatisch speichern)
  useEffect(() => {
    const profit = calcParoliSaldo(throws, einsatz, activeChanceKeys as any);
    setSaldo(kapital + profit);
  }, [throws, einsatz, kapital, activeChanceKeys, setSaldo]);

  return (
    <div className="app">
      <h1>Roulette (EU)</h1>

      {/* Steuerleiste */}
      <div className="controls">
        <div className="controls-row">
          <div className="field">
            <label htmlFor="einsatz">Einsatz</label>
            <input
              id="einsatz"
              type="number"
              min={0}
              step="1"
              value={einsatz}
              onChange={(e) => setEinsatz(parseNumber(e.target.value, einsatz))}
            />
          </div>
          <div className="field">
            <label htmlFor="kapital">Kapital</label>
            <input
              id="kapital"
              type="number"
              min={0}
              step="10"
              value={kapital}
              onChange={(e) => setKapital(parseNumber(e.target.value, kapital))}
            />
          </div>

          <div className="spacer" />

          <div className="checks">
            <label className="check">
              <input type="checkbox" checked={chances.low} onChange={() => toggleChance("low")} />
              <span>1–18</span>
            </label>
            <label className="check">
              <input type="checkbox" checked={chances.even} onChange={() => toggleChance("even")} />
              <span>Gerade</span>
            </label>
            <label className="check">
              <input type="checkbox" checked={chances.red} onChange={() => toggleChance("red")} />
              <span>Rot</span>
            </label>
            <label className="check">
              <input type="checkbox" checked={chances.black} onChange={() => toggleChance("black")} />
              <span>Schwarz</span>
            </label>
            <label className="check">
              <input type="checkbox" checked={chances.odd} onChange={() => toggleChance("odd")} />
              <span>Ungerade</span>
            </label>
            <label className="check">
              <input type="checkbox" checked={chances.high} onChange={() => toggleChance("high")} />
              <span>19–36</span>
            </label>
          </div>
        </div>

        <div className="hint small">
          System aktiv: bis 3 Paroli-Gewinne, bei Verlust 1× doppelter Basis-Einsatz (Erholungsversuch), danach Reset.
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab ${view === "board" ? "active" : ""}`} onClick={() => setView("board")}>
          Table-Board
        </button>
        <button className={`tab ${view === "wheel" ? "active" : ""}`} onClick={() => setView("wheel")}>
          Wheel
        </button>
      </div>

      <div className="layout">
        {/* Links: Board oder Wheel (Klick fügt Wurf hinzu) */}
        {view === "board" ? (
          <RouletteBoard selected={throws} onClickNumber={addThrow} />
        ) : (
          <RouletteWheel selected={throws} onClickNumber={addThrow} size={540} />
        )}

        {/* Rechts: Geworfene Zahlen + System-Anzeige */}
        <aside className="panel">
          <h2>Geworfene Zahlen</h2>

          {throws.length === 0 ? (
            <p>Noch keine Zahl geworfen. Klicke auf Board/Wheel.</p>
          ) : (
            <>
              <ul className="chip-list">
                {throws.map((n, i) => (
                  <li key={i}>
                    <span className={`badge ${numberColor(n)}`}>{n}</span>
                  </li>
                ))}
              </ul>

              <div className="actions">
                <button className="undo-btn" onClick={undoLast}>
                  Rückgängig
                </button>
                <button className="clear-btn" onClick={() => setThrows([])}>
                  Alles löschen
                </button>
              </div>
            </>
          )}

          {/* System-Status für aktive einfachen Chancen */}
          <div className="sys">
            <h3>Nächster Einsatz je einfache Chance</h3>
            {systemNextBets.length === 0 ? (
              <p className="hint small">Keine einfache Chance ausgewählt.</p>
            ) : (
              <table className="sys-table">
                <thead>
                  <tr>
                    <th>Chance</th>
                    <th>Status</th>
                    <th className="num">Nächster Einsatz</th>
                  </tr>
                </thead>
                <tbody>
                  {systemNextBets.map((s) => (
                    <tr key={s.key}>
                      <td>{s.label}</td>
                      <td>
                        {s.inRecovery ? (
                          <span className="tag">Erholungsversuch</span>
                        ) : s.winStreak > 0 ? (
                          <span className="tag">Paroli {s.winStreak}/3</span>
                        ) : (
                          <span className="tag dim">Basis</span>
                        )}
                      </td>
                      <td className="num">
                        <b>{s.nextStake}</b>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Saldo-Anzeige */}
          <div className="saldo">
            Aktueller Saldo: <strong>{saldo}</strong>
          </div>
        </aside>
      </div>

      <footer>
        <small>Klick auf eine Zahl = neuer Wurf. System berechnet für jede aktivierte einfache Chance den nächsten Einsatz.</small>
      </footer>
    </div>
  );
}
