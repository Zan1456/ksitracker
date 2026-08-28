export const RING_CIRCUMFERENCE = 282.7;

/** SVG progress ring — a full circle stroked with `color` up to `fraction` (0–1), the rest left as a faint track. */
export function Ring({
  fraction,
  color,
  size = 236,
  strokeWidth = 3,
}: {
  fraction: number;
  color: string;
  size?: number;
  strokeWidth?: number;
}) {
  const offset = RING_CIRCUMFERENCE * Math.min(1, Math.max(0, fraction));
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={50} cy={50} r={45} fill="none" stroke="var(--color-border)" strokeWidth={strokeWidth} />
      <circle
        cx={50}
        cy={50}
        r={45}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={RING_CIRCUMFERENCE}
        strokeDashoffset={offset}
        strokeLinecap="round"
      />
    </svg>
  );
}
