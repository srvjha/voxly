
export function VoxlyMark({
  size = 28,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 28 28" width={size} height={size}>
        {Array.from({ length: 6 }).map((_, i) => {
          const angle = (i * 60 * Math.PI) / 180;
          const x = 14 + Math.cos(angle) * 9;
          const y = 14 + Math.sin(angle) * 9;
          return (
            <line
              key={i}
              x1="14"
              y1="14"
              x2={x.toFixed(2)}
              y2={y.toFixed(2)}
              stroke="#F97316"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          );
        })}
        <circle cx="14" cy="14" r="2.6" fill="#F97316" />
      </svg>
    </span>
  );
}
