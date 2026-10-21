import { useId } from "react";

type Props = {
  date: string;
  time?: string;
  top?: string;
  bottom?: string;
  /** Wavy cancellation lines to the right of the ring. */
  cancel?: boolean;
  tilt?: number;
  className?: string;
  title?: string;
};

/**
 * A rubber-stamp postmark in violet ink. Used wherever Keepsake records a
 * moment: a check-in, a due date, a release.
 */
export function Postmark({ date, time, top = "KEEPSAKE", bottom = "CHECKED IN", cancel = true, tilt = -8, className, title }: Props) {
  const raw = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const id = (s: string) => `pm${raw}${s}`;
  const width = cancel ? 230 : 140;

  return (
    <svg
      viewBox={`0 0 ${width} 140`}
      className={className}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      style={{ color: "var(--violet)", overflow: "visible" }}
    >
      <defs>
        <path id={id("top")} d="M 23 70 A 47 47 0 0 1 117 70" />
        <path id={id("bottom")} d="M 17 70 A 53 53 0 0 0 123 70" />
        <filter id={id("ink")} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="noise" />
          <feColorMatrix in="noise" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.2 1.6" result="speckle" />
          <feComposite in="SourceGraphic" in2="speckle" operator="in" result="inked" />
          <feDisplacementMap in="inked" in2="noise" scale="1.6" />
        </filter>
      </defs>
      <g transform={`rotate(${tilt} 70 70)`} filter={`url(#${id("ink")})`} fill="none" stroke="currentColor">
        <circle cx="70" cy="70" r="62" strokeWidth="3" />
        <circle cx="70" cy="70" r="38" strokeWidth="1.6" />
        <g
          fill="currentColor"
          stroke="none"
          style={{ fontFamily: "var(--font-print)", fontVariationSettings: '"wdth" 75', fontWeight: 700, letterSpacing: "0.12em" }}
        >
          <text fontSize="13">
            <textPath href={`#${id("top")}`} startOffset="50%" textAnchor="middle">
              {top}
            </textPath>
          </text>
          <text fontSize="11">
            <textPath href={`#${id("bottom")}`} startOffset="50%" textAnchor="middle">
              {bottom}
            </textPath>
          </text>
          <text x="70" y={time ? 69 : 75} fontSize="14" textAnchor="middle" style={{ letterSpacing: "0.04em" }}>
            {date}
          </text>
          {time ? (
            <text x="70" y="86" fontSize="12" textAnchor="middle" style={{ letterSpacing: "0.06em" }}>
              {time}
            </text>
          ) : null}
        </g>
        {cancel ? (
          <g strokeWidth="3" strokeLinecap="round">
            {[40, 56, 72, 88, 104].map((y) => (
              <path key={y} d={`M 142 ${y} q 11 -7 22 0 t 22 0 t 22 0 t 20 0`} />
            ))}
          </g>
        ) : null}
      </g>
    </svg>
  );
}
