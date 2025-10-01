import { memo, useMemo } from "react";
import { numberColor, WHEEL_ORDER } from "../roulette";

type Props = {
  selected: number[];
  onClickNumber: (n: number) => void;
  size?: number; // optional: px, default 520
};

type Segment = {
  n: number;
  start: number;
  end: number;
  mid: number;
  d: string; // SVG path
  labelPos: { x: number; y: number };
};

// const TAU = Math.PI * 2;

/** Hilfsfunktionen für Kreisbögen */
function polar(cx: number, cy: number, r: number, angleRad: number) {
  return { x: cx + r * Math.cos(angleRad), y: cy + r * Math.sin(angleRad) };
}

function ringSlicePath(
  cx: number,
  cy: number,
  rInner: number,
  rOuter: number,
  a0: number,
  a1: number
) {
  // Großbogen-Flag
  const largeArc = a1 - a0 > Math.PI ? 1 : 0;

  const p0 = polar(cx, cy, rOuter, a0);
  const p1 = polar(cx, cy, rOuter, a1);
  const p2 = polar(cx, cy, rInner, a1);
  const p3 = polar(cx, cy, rInner, a0);

  return [
    `M ${p0.x} ${p0.y}`,
    `A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${p1.x} ${p1.y}`,
    `L ${p2.x} ${p2.y}`,
    `A ${rInner} ${rInner} 0 ${largeArc} 0 ${p3.x} ${p3.y}`,
    "Z",
  ].join(" ");
}

function clampAngleDeg(deg: number) {
  return ((deg % 360) + 360) % 360;
}

/**
 * 0° zeigt nach rechts in SVG – wir wollen 0 oben (12 Uhr).
 * Daher -90° Offset.
 */
const ZERO_OFFSET_DEG = -90;

function degToRad(d: number) {
  return (d * Math.PI) / 180;
}

function buildSegments(
  cx: number,
  cy: number,
  rInner: number,
  rOuter: number
): Segment[] {
  const count = WHEEL_ORDER.length; // 37
  const stepDeg = 360 / count;

  return WHEEL_ORDER.map((n, i) => {
    const startDeg = ZERO_OFFSET_DEG + i * stepDeg;
    const endDeg = ZERO_OFFSET_DEG + (i + 1) * stepDeg;
    const midDeg = ZERO_OFFSET_DEG + (i + 0.5) * stepDeg;

    const a0 = degToRad(startDeg);
    const a1 = degToRad(endDeg);
    const amid = degToRad(midDeg);

    const d = ringSlicePath(cx, cy, rInner, rOuter, a0, a1);

    const labelR = (rInner + rOuter) / 2;
    const { x, y } = polar(cx, cy, labelR, amid);

    return {
      n,
      start: clampAngleDeg(startDeg),
      end: clampAngleDeg(endDeg),
      mid: clampAngleDeg(midDeg),
      d,
      labelPos: { x, y },
    };
  });
}

function textClassFor(n: number) {
  // Weiße Ziffern auf Rot/Schwarz, dunklere auf Grün
  const c = numberColor(n);
  return c === "green" ? "wheel-label-dark" : "wheel-label";
}

export default memo(function RouletteWheel({
  selected,
  onClickNumber,
  size = 520,
}: Props) {
  const padding = 8;
  const stroke = 1.25;

  const cx = size / 2;
  const cy = size / 2;

  // Ring-Geometrie
  const rOuter = size / 2 - padding;
  const rInner = rOuter - 80; // Breite der Sektoren
  const rHubOuter = rInner - 20; // innerer Kreis (Zierrahmen)
  const rHubInner = rHubOuter - 24; // kleiner Hub

  const segments = useMemo(
    () => buildSegments(cx, cy, rInner, rOuter),
    [cx, cy, rInner, rOuter]
  );

  return (
    <div className="wheel-wrap" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label="Roulette Wheel"
      >
        {/* Filz-Hintergrund */}
        <defs>
          <radialGradient id="feltGrad" cx="35%" cy="30%" r="80%">
            <stop offset="0%" stopColor="#16663e" />
            <stop offset="100%" stopColor="#0f3e25" />
          </radialGradient>
          <radialGradient id="hubGrad" cx="40%" cy="35%" r="70%">
            <stop offset="0%" stopColor="#2c3137" />
            <stop offset="100%" stopColor="#171b20" />
          </radialGradient>
        </defs>
        <circle cx={cx} cy={cy} r={rOuter + padding} fill="url(#feltGrad)" />

        {/* Sektoren */}
        {segments.map((seg) => {
          const color = numberColor(seg.n);
          const isSel = selected.includes(seg.n);
          return (
            <g key={seg.n}>
              <path
                d={seg.d}
                className={`wheel-segment ${color} ${
                  isSel ? "sel" : ""
                }`.trim()}
                onClick={() => onClickNumber(seg.n)}
                tabIndex={0}
                onKeyDown={(e) =>
                  (e.key === "Enter" || e.key === " ") &&
                  onClickNumber(seg.n)
                }
              />
              {/* Trennlinie */}
              <path
                d={ringSlicePath(cx, cy, rInner, rOuter, degToRad(seg.end), degToRad(seg.end))}
                className="wheel-divider"
              />
            </g>
          );
        })}

        {/* Innenringe (Zierrahmen) */}
        <circle
          cx={cx}
          cy={cy}
          r={rInner}
          className="wheel-ring"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={cx}
          cy={cy}
          r={rHubOuter}
          className="wheel-ring"
          strokeWidth={stroke}
          fill="none"
        />
        <circle cx={cx} cy={cy} r={rHubInner} fill="url(#hubGrad)" />

        {/* Labels */}
        {segments.map((seg) => (
          <text
            key={`label-${seg.n}`}
            x={seg.labelPos.x}
            y={seg.labelPos.y + 5}
            className={textClassFor(seg.n)}
            textAnchor="middle"
            fontSize={18}
            fontWeight={700}
            onClick={() => onClickNumber(seg.n)}
          >
            {seg.n}
          </text>
        ))}

        {/* 0-Highlight (schmaler Ring) */}
        <circle
          cx={cx}
          cy={cy}
          r={(rInner + rOuter) / 2}
          className="wheel-zero-ring"
          fill="none"
        />
      </svg>
    </div>
  );
});
