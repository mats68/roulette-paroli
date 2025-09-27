import { numberColor } from "../roulette";

type Props = {
  n: number;
  selected: boolean;
  onClick: () => void;
};

export default function NumberCell({ n, selected, onClick }: Props) {
  const color = numberColor(n); // "red" | "black"
  return (
    <div
      className={`cell ${color} ${selected ? "selected" : ""}`}
      onClick={onClick}
      role="button"
      aria-pressed={selected}
      aria-label={`Number ${n}`}
      tabIndex={0}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onClick()}
    >
      {n}
    </div>
  );
}
