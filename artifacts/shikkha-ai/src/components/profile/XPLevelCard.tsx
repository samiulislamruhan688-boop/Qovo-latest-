import { motion } from "framer-motion";
import { useGetProgressSummary } from "@workspace/api-client-react";
import { Zap, ChevronRight, Star } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const LEVELS = [
  { name: "শিক্ষানবিশ",  min: 0,    max: 100,  num: 1, color: "#94a3b8" },
  { name: "অগ্রগামী",    min: 100,  max: 500,  num: 2, color: "#60a5fa" },
  { name: "মেধাবী",      min: 500,  max: 1500, num: 3, color: "#a78bfa" },
  { name: "বিশেষজ্ঞ",   min: 1500, max: 5000, num: 4, color: "#f59e0b" },
  { name: "মাস্টার",    min: 5000, max: 9999, num: 5, color: "#f97316" },
] as const;

export function XPLevelCard() {
  const { data: summary, isLoading } = useGetProgressSummary();

  if (isLoading) return <Skeleton className="h-28 rounded-3xl" />;

  const xp     = summary?.totalPoints ?? 0;
  const lvl    = LEVELS.findLast((l) => xp >= l.min) ?? LEVELS[0];
  const next   = LEVELS.find((l) => l.num === lvl.num + 1);
  const pct    = next ? Math.min(((xp - lvl.min) / (next.min - lvl.min)) * 100, 100) : 100;
  const toNext = next ? next.min - xp : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-3xl p-5 md:p-6 border border-white/10"
      style={{ background: "linear-gradient(135deg, rgba(20,15,50,0.95) 0%, rgba(10,10,35,0.98) 100%)" }}
    >
      {/* Glow */}
      <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full pointer-events-none"
        style={{ background: `radial-gradient(circle, ${lvl.color}30 0%, transparent 70%)` }} />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: `${lvl.color}25`, border: `1px solid ${lvl.color}40` }}>
              <Star className="w-5 h-5" style={{ color: lvl.color }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-white text-base">{lvl.name}</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-bold text-white/60 border border-white/10 bg-white/5">
                  Lv.{lvl.num}
                </span>
              </div>
              <p className="text-xs text-white/40 mt-0.5">
                {xp.toLocaleString("bn-BD")} XP অর্জিত
              </p>
            </div>
          </div>

          {next && (
            <div className="text-right">
              <div className="flex items-center gap-1 text-white/40 text-xs">
                <Zap className="w-3 h-3" />
                <span>পরের লেভেল</span>
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-sm font-bold" style={{ color: next.color }}>{next.name}</span>
                <ChevronRight className="w-3.5 h-3.5" style={{ color: next.color }} />
              </div>
              <p className="text-xs text-white/30">আর {toNext.toLocaleString("bn-BD")} XP</p>
            </div>
          )}
        </div>

        {/* XP Bar */}
        <div className="mb-2">
          <div className="flex justify-between text-xs text-white/40 mb-1.5">
            <span>{xp.toLocaleString("bn-BD")} XP</span>
            {next && <span>{next.min.toLocaleString("bn-BD")} XP</span>}
          </div>
          <div className="h-3 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
              className="h-full rounded-full relative overflow-hidden"
              style={{ background: `linear-gradient(90deg, ${lvl.color}cc, ${next?.color ?? lvl.color})` }}
            >
              {/* Shimmer */}
              <motion.div
                animate={{ x: ["-100%", "300%"] }}
                transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2, ease: "easeInOut" }}
                className="absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"
              />
            </motion.div>
          </div>
        </div>

        {/* Level pills */}
        <div className="flex items-center gap-1 mt-3">
          {LEVELS.map((l) => (
            <div key={l.num}
              className={`flex-1 h-1 rounded-full transition-all ${l.num <= lvl.num ? "" : "bg-white/10"}`}
              style={l.num <= lvl.num ? { background: l.color } : {}} />
          ))}
        </div>
        <div className="flex justify-between mt-1">
          {LEVELS.map((l) => (
            <span key={l.num} className={`text-[9px] font-bold ${l.num <= lvl.num ? "opacity-80" : "opacity-20"}`}
              style={l.num <= lvl.num ? { color: l.color } : {}}>
              {l.num}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
