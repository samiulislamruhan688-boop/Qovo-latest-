interface QovoLogoProps {
  size?: number;
  withText?: boolean;
  className?: string;
}

export function QovoLogo({ size = 36, withText = true, className }: QovoLogoProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className ?? ""}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        xmlns="http://www.w3.org/2000/svg"
        className="qovo-glow rounded-xl"
      >
        <defs>
          <linearGradient id="qovo-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="hsl(224 85% 55%)" />
            <stop offset="50%" stopColor="hsl(190 85% 50%)" />
            <stop offset="100%" stopColor="hsl(174 80% 45%)" />
          </linearGradient>
          <radialGradient id="qovo-shine" cx="0.3" cy="0.25" r="0.6">
            <stop offset="0%" stopColor="rgba(255,255,255,0.55)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>
        </defs>
        <rect width="64" height="64" rx="14" fill="url(#qovo-grad)" />
        <rect width="64" height="64" rx="14" fill="url(#qovo-shine)" />
        <circle cx="32" cy="32" r="14" fill="none" stroke="white" strokeWidth="4.5" />
        <line
          x1="40"
          y1="40"
          x2="51"
          y2="51"
          stroke="white"
          strokeWidth="4.5"
          strokeLinecap="round"
        />
        <circle cx="51" cy="51" r="3.2" fill="hsl(174 95% 70%)" />
      </svg>
      {withText && (
        <div className="leading-none">
          <div className="text-2xl font-extrabold qovo-gradient-text tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Qovo
          </div>
        </div>
      )}
    </div>
  );
}
