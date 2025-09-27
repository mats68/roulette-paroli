import NumberCell from "./NumberCell";
import { gridRows } from "../roulette";

type Props = {
  selected: number[];
  onClickNumber: (n: number) => void;
};

export default function RouletteBoard({ selected, onClickNumber }: Props) {
  return (
    <div className="table">
      {/* Zero-Spalte */}
      <div className="zero-cell" onClick={() => onClickNumber(0)}>
        0
      </div>

      {/* 3 Spalten x 12 Reihen (3–36 / 2–35 / 1–34 von oben nach unten) */}
      {gridRows.map((row, ri) =>
        row.map((n, ci) => (
          <NumberCell
            key={`${ri}-${ci}`}
            n={n}
            selected={selected.includes(n)}
            onClick={() => onClickNumber(n)}
          />
        ))
      )}
    </div>
  );
}
