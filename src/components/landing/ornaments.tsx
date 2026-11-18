/**
 * Original line-art ornaments for the landing page: an olive branch (peace,
 * Psalm 52:8) and small four-point sparkles. Hand-drawn in SVG for What Stuck.
 */

const leaves: Array<[number, number, number]> = [
  // x, y, rotation of each leaf along the branch
  [38, 168, -58],
  [60, 150, 34],
  [62, 128, -52],
  [86, 114, 40],
  [86, 92, -46],
  [110, 80, 44],
  [108, 58, -40],
  [132, 48, 50],
  [130, 28, -34],
  [150, 18, 58],
];

export function OliveBranch({
  className = "",
  flip = false,
}: {
  className?: string;
  flip?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 180 200"
      fill="none"
      aria-hidden
      className={className}
      style={flip ? { transform: "scaleX(-1)" } : undefined}
    >
      <path
        d="M14 196C40 170 58 150 74 124C90 98 104 72 126 48C138 34 150 22 168 8"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      {leaves.map(([x, y, r], i) => (
        <g key={i} transform={`translate(${x} ${y}) rotate(${r})`}>
          <path d="M0 0C6 -6 18 -7 26 0C18 7 6 6 0 0Z" stroke="currentColor" strokeWidth="1.2" />
          <path d="M2 0H22" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" />
        </g>
      ))}
      {[
        [96, 136],
        [118, 104],
        [144, 70],
      ].map(([cx, cy], i) => (
        <ellipse
          key={`o${i}`}
          cx={cx}
          cy={cy}
          rx="4.5"
          ry="6"
          stroke="currentColor"
          strokeWidth="1.2"
        />
      ))}
    </svg>
  );
}

export function Sparkle({ className = "", size = 12 }: { className?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden className={className}>
      <path
        d="M12 0C13 8 16 11 24 12C16 13 13 16 12 24C11 16 8 13 0 12C8 11 11 8 12 0Z"
        fill="currentColor"
      />
    </svg>
  );
}
