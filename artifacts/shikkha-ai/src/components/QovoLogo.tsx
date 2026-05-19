import qLogoSrc from "/qovo-q.png";

interface QovoLogoProps {
  size?: number;
  withText?: boolean;
  className?: string;
  glow?: boolean;
}

export function QovoLogo({ size = 36, withText = true, className, glow = true }: QovoLogoProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className ?? ""}`}>
      <img
        src={qLogoSrc}
        alt="Qovo"
        width={size}
        height={size}
        className={`rounded-2xl object-cover flex-shrink-0 ${glow ? "qovo-glow-sm" : ""}`}
        style={{ width: size, height: size }}
      />
      {withText && (
        <div className="leading-none">
          <div
            className="font-extrabold qovo-gradient-text tracking-tight"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: size * 0.62 }}
          >
            Qovo
          </div>
        </div>
      )}
    </div>
  );
}

/* Standalone large logo for splash / hero — uses the real PNG */
export function QovoLogoLarge({ size = 120, glow = true }: { size?: number; glow?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <img
        src={qLogoSrc}
        alt="Qovo"
        width={size}
        height={size}
        className={`rounded-3xl object-cover ${glow ? "logo-glow-ring" : ""}`}
        style={{ width: size, height: size }}
      />
      <div
        className="font-extrabold qovo-gradient-text tracking-tight"
        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: size * 0.28 }}
      >
        Qovo
      </div>
    </div>
  );
}
