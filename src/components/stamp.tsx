import { useId } from "react";

type Props = {
  value: string;
  caption: string;
  className?: string;
  tilt?: number;
  /** One marigold, or a garland of them. */
  motif?: "flower" | "garland";
};

function petals(cx: number, cy: number, count: number, radius: number, rx: number, ry: number, offset = 0) {
  return Array.from({ length: count }, (_, i) => {
    const angle = (360 / count) * i + offset;
    const rad = (angle * Math.PI) / 180;
    const x = (cx + radius * Math.cos(rad)).toFixed(2);
    const y = (cy + radius * Math.sin(rad)).toFixed(2);
    return <ellipse key={`${cx}-${cy}-${radius}-${i}`} cx={x} cy={y} rx={rx} ry={ry} transform={`rotate(${angle + 90} ${x} ${y})`} />;
  });
}

function Marigold() {
  const cx = 60;
  const cy = 74;
  return (
    <>
      <g fill="var(--leaf)">
        <path d="M60 100 C 44 104 34 116 30 128 C 44 126 56 116 60 100 Z" />
        <path d="M60 100 C 76 104 86 116 90 128 C 76 126 64 116 60 100 Z" />
      </g>
      <g fill="var(--marigold)">{petals(cx, cy, 18, 25, 6.5, 10)}</g>
      <g fill="#f0b24a">{petals(cx, cy, 14, 17, 5.5, 8.5, 12)}</g>
      <g fill="var(--marigold-deep)">{petals(cx, cy, 9, 9, 4.5, 6.5, 20)}</g>
      <circle cx={cx} cy={cy} r="4.5" fill="#7a3f0a" />
    </>
  );
}

/** A toran-style string of small marigolds hung across the stamp. */
function Garland() {
  const point = (t: number) => {
    // Quadratic curve from (14, 50) through a low point to (106, 50).
    const x = (1 - t) ** 2 * 14 + 2 * (1 - t) * t * 60 + t ** 2 * 106;
    const y = (1 - t) ** 2 * 50 + 2 * (1 - t) * t * 104 + t ** 2 * 50;
    return { x, y };
  };
  const blooms = [0.06, 0.2, 0.35, 0.5, 0.65, 0.8, 0.94].map(point);
  return (
    <>
      <path d="M14 50 Q 60 104 106 50" fill="none" stroke="var(--leaf)" strokeWidth="1.4" />
      {blooms.map((b, i) => (
        <g key={i}>
          <g fill={i % 2 ? "var(--marigold-deep)" : "var(--marigold)"}>{petals(b.x, b.y, 11, 6.5, 2.8, 4.4, i * 9)}</g>
          <g fill="#f0b24a">{petals(b.x, b.y, 7, 3, 2, 2.8, 10)}</g>
          <circle cx={b.x} cy={b.y} r="1.6" fill="#7a3f0a" />
        </g>
      ))}
      <path d="M60 86 L 60 104" stroke="var(--leaf)" strokeWidth="1.4" />
      <g fill="var(--marigold)">{petals(60, 108, 11, 6, 2.6, 4, 4)}</g>
      <circle cx="60" cy="108" r="1.8" fill="#7a3f0a" />
    </>
  );
}

/**
 * A perforated stamp with a marigold. The denomination is the price; the
 * caption says what it buys.
 */
export function Stamp({ value, caption, className, tilt = 0, motif = "flower" }: Props) {
  const raw = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const mask = `st${raw}`;
  const holes: { x: number; y: number }[] = [];
  for (let x = 4; x <= 120; x += 9.6) holes.push({ x, y: 0 }, { x, y: 150 });
  for (let y = 4; y <= 150; y += 9.4) holes.push({ x: 0, y }, { x: 120, y });

  return (
    <svg viewBox="0 0 120 150" className={className} role="img" aria-label={`${value}: ${caption}`} style={{ transform: `rotate(${tilt}deg)`, filter: "drop-shadow(0 3px 5px rgb(28 42 94 / 0.22))" }}>
      <defs>
        <mask id={mask}>
          <rect width="120" height="150" fill="#fff" />
          {holes.map((h) => (
            <circle key={`${h.x}-${h.y}`} cx={h.x} cy={h.y} r="3.6" fill="#000" />
          ))}
        </mask>
      </defs>
      <g mask={`url(#${mask})`}>
        <rect width="120" height="150" fill="#f6f1e6" />
        <rect x="9" y="9" width="102" height="132" fill="#e9eff4" stroke="var(--red)" strokeWidth="1.6" />
        {motif === "garland" ? <Garland /> : <Marigold />}
        <text
          x="16"
          y="34"
          fill="var(--red)"
          style={{ fontFamily: "var(--font-print)", fontWeight: 750, fontVariationSettings: '"wdth" 80' }}
          fontSize="22"
        >
          {value}
        </text>
        <text
          x="60"
          y="135"
          textAnchor="middle"
          fill="var(--ink)"
          style={{ fontFamily: "var(--font-print)", fontWeight: 650, fontVariationSettings: '"wdth" 75', letterSpacing: "0.14em" }}
          fontSize="8.5"
        >
          KEEPSAKE
        </text>
      </g>
    </svg>
  );
}
