import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import qLogoSrc from "/qovo-q.png";

export function SplashScreen({ onDone }: { onDone: () => void }) {
  const [barProgress, setBarProgress] = useState(0);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    // Animate progress bar
    let start: number | null = null;
    const duration = 2000;
    function step(ts: number) {
      if (!start) start = ts;
      const elapsed = ts - start;
      const pct = Math.min((elapsed / duration) * 100, 100);
      setBarProgress(pct);
      if (elapsed < duration) {
        requestAnimationFrame(step);
      } else {
        // Start exit fade then call onDone
        setTimeout(() => {
          setExiting(true);
          setTimeout(onDone, 500);
        }, 200);
      }
    }
    const raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [onDone]);

  return (
    <AnimatePresence>
      {!exiting ? (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
          style={{
            background: "radial-gradient(ellipse at 30% 20%, rgba(0,180,255,0.15) 0%, transparent 55%), radial-gradient(ellipse at 75% 80%, rgba(147,51,255,0.18) 0%, transparent 55%), hsl(228, 45%, 7%)",
          }}
        >
          {/* Ambient glow orbs */}
          <div
            className="absolute w-80 h-80 rounded-full pointer-events-none"
            style={{
              top: "10%", left: "5%",
              background: "radial-gradient(circle, rgba(0,180,255,0.18) 0%, transparent 70%)",
              animation: "pulse-glow 4s ease-in-out infinite",
            }}
          />
          <div
            className="absolute w-96 h-96 rounded-full pointer-events-none"
            style={{
              bottom: "5%", right: "0%",
              background: "radial-gradient(circle, rgba(147,51,255,0.18) 0%, transparent 70%)",
              animation: "pulse-glow 5s ease-in-out infinite 1s",
            }}
          />

          {/* Spinning ring behind logo */}
          <div className="relative mb-8">
            <div
              className="absolute inset-0 rounded-full border-2 border-transparent"
              style={{
                background: "conic-gradient(from 0deg, #22CCFF, #4C6EFF, #A855F7, transparent, transparent) border-box",
                WebkitMask: "linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)",
                WebkitMaskComposite: "xor",
                maskComposite: "exclude",
                inset: "-8px",
                borderRadius: "50%",
                width: "calc(100% + 16px)",
                height: "calc(100% + 16px)",
                animation: "spin-slow 3s linear infinite",
              }}
            />

            {/* Logo */}
            <motion.div
              initial={{ scale: 0.6, opacity: 0, filter: "blur(16px)" }}
              animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              style={{ animation: "float 3s ease-in-out infinite" }}
            >
              <img
                src={qLogoSrc}
                alt="Qovo"
                className="rounded-3xl logo-glow-ring"
                style={{ width: 120, height: 120 }}
              />
            </motion.div>
          </div>

          {/* App name */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6, ease: "easeOut" }}
            className="text-center mb-2"
          >
            <div
              className="font-extrabold qovo-gradient-text tracking-tight"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 40 }}
            >
              Qovo
            </div>
          </motion.div>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.75, duration: 0.6 }}
            className="text-sm font-medium mb-12"
            style={{ color: "rgba(200,210,255,0.65)", letterSpacing: "0.08em" }}
          >
            SSC প্রস্তুতি · স্মার্ট · বিনামূল্যে
          </motion.p>

          {/* Progress bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="w-56"
          >
            <div
              className="h-1 rounded-full overflow-hidden"
              style={{ background: "rgba(255,255,255,0.10)" }}
            >
              <div
                className="h-full rounded-full transition-none"
                style={{
                  width: `${barProgress}%`,
                  background: "linear-gradient(90deg, #22CCFF 0%, #4C6EFF 50%, #A855F7 100%)",
                  boxShadow: "0 0 12px rgba(100,120,255,0.8)",
                  transition: "width 0.05s linear",
                }}
              />
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
