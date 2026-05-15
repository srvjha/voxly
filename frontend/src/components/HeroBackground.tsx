
export function HeroBackground() {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 -z-10 overflow-hidden pointer-events-none"
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 80% 60% at 50% 40%, var(--hero-warm, #FFF0DC) 0%, var(--hero-cool, #EEF0FC) 50%, var(--color-background) 100%)",
        }}
      />
      <style>{`
        :root {
          --hero-warm: #FFE6C2;
          --hero-cool: #DCE0FA;
        }
        [data-theme="dark"] {
          --hero-warm: #1A0E05;
          --hero-cool: #0D0B35;
        }
      `}</style>
      <div
        className="absolute -left-32 top-10 w-[480px] h-[420px] blur-3xl opacity-70 dark:opacity-40 rounded-[60%_40%_55%_45%/55%_45%_60%_40%]"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(249, 115, 22, 0.45) 0%, rgba(249, 115, 22, 0) 70%)",
        }}
      />
      <div
        className="absolute -right-40 bottom-8 w-[520px] h-[440px] blur-3xl opacity-70 dark:opacity-50 rounded-[55%_45%_60%_40%/60%_40%_55%_45%]"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(55, 48, 163, 0.38) 0%, rgba(55, 48, 163, 0) 70%)",
        }}
      />

      <div className="mandala-bg">
        <Mandala />
      </div>

      <div className="absolute top-0 left-0 right-0 jali-strip" />
      <div className="absolute bottom-0 left-0 right-0 jali-strip" />
    </div>
  );
}

export function Mandala({
  size = 800,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  const cx = 400;
  const cy = 400;
  const petals = 12;

  const outerR = 360;
  const midR = 240;
  const innerR = 140;

  const petalsOuter = Array.from({ length: petals }).map((_, i) => {
    const a = (i * 360) / petals;
    return (
      <g key={`po-${i}`} transform={`rotate(${a} ${cx} ${cy})`}>
        <path
          d={`M ${cx} ${cy - outerR}
              C ${cx + 70} ${cy - outerR + 40},
                ${cx + 70} ${cy - midR - 40},
                ${cx} ${cy - midR}
              C ${cx - 70} ${cy - midR - 40},
                ${cx - 70} ${cy - outerR + 40},
                ${cx} ${cy - outerR} Z`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
        />
      </g>
    );
  });

  const petalsInner = Array.from({ length: petals }).map((_, i) => {
    const a = (i * 360) / petals + 15;
    return (
      <g key={`pi-${i}`} transform={`rotate(${a} ${cx} ${cy})`}>
        <path
          d={`M ${cx} ${cy - midR}
              C ${cx + 38} ${cy - midR + 26},
                ${cx + 38} ${cy - innerR - 26},
                ${cx} ${cy - innerR}
              C ${cx - 38} ${cy - innerR - 26},
                ${cx - 38} ${cy - midR + 26},
                ${cx} ${cy - midR} Z`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
        />
      </g>
    );
  });

  const radialLines = Array.from({ length: petals * 2 }).map((_, i) => {
    const a = ((i * 360) / (petals * 2)) * (Math.PI / 180);
    const x1 = cx + Math.cos(a) * 60;
    const y1 = cy + Math.sin(a) * 60;
    const x2 = cx + Math.cos(a) * outerR;
    const y2 = cy + Math.sin(a) * outerR;
    return (
      <line
        key={`rl-${i}`}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke="currentColor"
        strokeWidth="0.6"
        opacity="0.5"
      />
    );
  });

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 800 800"
      className={className}
      style={{ color: "inherit" }}
    >
      <circle cx={cx} cy={cy} r={outerR} fill="none" stroke="currentColor" strokeWidth="1.4" />
      <circle cx={cx} cy={cy} r={midR}   fill="none" stroke="currentColor" strokeWidth="1.2" />
      <circle cx={cx} cy={cy} r={innerR} fill="none" stroke="currentColor" strokeWidth="1.2" />
      <circle cx={cx} cy={cy} r="60"     fill="none" stroke="currentColor" strokeWidth="1.0" />
      <circle cx={cx} cy={cy} r="22"     fill="none" stroke="currentColor" strokeWidth="1.0" />
      {radialLines}
      {petalsOuter}
      {petalsInner}
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (i * 45 * Math.PI) / 180;
        const x = cx + Math.cos(a) * 38;
        const y = cy + Math.sin(a) * 38;
        return (
          <circle key={`cf-${i}`} cx={x} cy={y} r="6" fill="none" stroke="currentColor" strokeWidth="1" />
        );
      })}
    </svg>
  );
}
