import { motion } from "framer-motion";
import { useGetProgressSummary, useGetStreak } from "@workspace/api-client-react";
import { Lock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Badge {
  id: string;
  emoji: string;
  label: string;
  desc: string;
  color: string;
  unlocked: boolean;
}

function buildBadges(
  summary: { totalPoints: number; totalAnswered: number; totalCorrect: number; accuracy: number; testsCompleted: number } | undefined,
  streak: { currentStreak: number; longestStreak: number } | undefined,
): Badge[] {
  const pts   = summary?.totalPoints ?? 0;
  const ans   = summary?.totalAnswered ?? 0;
  const acc   = summary?.accuracy ?? 0;
  const tests = summary?.testsCompleted ?? 0;
  const cur   = streak?.currentStreak ?? 0;
  const lng   = streak?.longestStreak ?? 0;

  return [
    { id: "first-answer", emoji: "✅", label: "প্রথম পদক্ষেপ", desc: "১টি প্রশ্নের উত্তর দিন", color: "#10b981", unlocked: ans >= 1 },
    { id: "streak7",      emoji: "🔥", label: "সাপ্তাহিক যোদ্ধা", desc: "৭ দিনের স্ট্রিক", color: "#f97316", unlocked: cur >= 7 || lng >= 7 },
    { id: "streak30",     emoji: "🔥🔥", label: "মাসিক চ্যাম্পিয়ন", desc: "৩০ দিনের স্ট্রিক", color: "#ef4444", unlocked: cur >= 30 || lng >= 30 },
    { id: "mcq100",       emoji: "📚", label: "শতক", desc: "১০০টি MCQ সমাধান", color: "#60a5fa", unlocked: ans >= 100 },
    { id: "mcq500",       emoji: "📖", label: "অধ্যবসায়ী", desc: "৫০০টি MCQ সমাধান", color: "#818cf8", unlocked: ans >= 500 },
    { id: "mcq1000",      emoji: "🏆", label: "মাস্টার পাঠক", desc: "১০০০টি MCQ সমাধান", color: "#f59e0b", unlocked: ans >= 1000 },
    { id: "acc80",        emoji: "🎯", label: "নিখুঁত লক্ষ্য", desc: "৮০%+ সঠিকতার হার", color: "#34d399", unlocked: ans >= 20 && acc >= 80 },
    { id: "acc95",        emoji: "💎", label: "পারফেক্ট শ্যুটার", desc: "৯৫%+ সঠিকতার হার", color: "#e879f9", unlocked: ans >= 20 && acc >= 95 },
    { id: "first-test",   emoji: "📝", label: "টেস্ট শুরু", desc: "প্রথম মডেল টেস্ট", color: "#a78bfa", unlocked: tests >= 1 },
    { id: "tests5",       emoji: "⚡", label: "স্পিড মাস্টার", desc: "৫টি মডেল টেস্ট সম্পন্ন", color: "#fbbf24", unlocked: tests >= 5 },
    { id: "pts500",       emoji: "💰", label: "পয়েন্ট সংগ্রাহক", desc: "৫০০ XP অর্জন", color: "#f97316", unlocked: pts >= 500 },
    { id: "pts2000",      emoji: "🌟", label: "উজ্জ্বল তারা", desc: "২০০০ XP অর্জন", color: "#fde047", unlocked: pts >= 2000 },
  ];
}

export function AchievementBadges() {
  const { data: summary, isLoading: ls } = useGetProgressSummary();
  const { data: streak,  isLoading: lk } = useGetStreak();

  if (ls || lk) {
    return (
      <div>
        <h2 className="text-sm font-bold text-white/40 uppercase tracking-widest mb-3 px-1">Achievements</h2>
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" style={{ background: "rgba(255,255,255,0.05)" }} />
          ))}
        </div>
      </div>
    );
  }

  const badges = buildBadges(summary, streak);
  const unlockedCount = badges.filter((b) => b.unlocked).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-sm font-bold text-white/40 uppercase tracking-widest">Achievements</h2>
        <span className="text-xs text-white/30 font-semibold">
          {unlockedCount}/{badges.length} আনলক
        </span>
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-white/8 p-5"
        style={{ background: "linear-gradient(135deg, rgba(15,15,40,0.95) 0%, rgba(8,8,25,0.98) 100%)" }}>

        <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
          {badges.map((badge, i) => (
            <motion.div
              key={badge.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.04 }}
              whileHover={badge.unlocked ? { scale: 1.1, y: -3 } : {}}
              className="relative group"
            >
              <div
                className={`flex flex-col items-center gap-1.5 p-2.5 rounded-2xl border text-center transition-all ${
                  badge.unlocked
                    ? "border-white/15 cursor-default"
                    : "border-white/5 opacity-35 grayscale cursor-not-allowed"
                }`}
                style={badge.unlocked ? { background: `${badge.color}10`, borderColor: `${badge.color}25` } : { background: "rgba(255,255,255,0.03)" }}
              >
                <span className="text-2xl leading-none">{badge.unlocked ? badge.emoji : "🔒"}</span>
                <span className="text-[9px] font-bold leading-tight text-center"
                  style={badge.unlocked ? { color: badge.color } : { color: "rgba(255,255,255,0.2)" }}>
                  {badge.label}
                </span>
                {!badge.unlocked && (
                  <Lock className="w-2.5 h-2.5 text-white/20" />
                )}
              </div>

              {/* Tooltip on hover */}
              {badge.unlocked && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 rounded-xl text-[10px] font-semibold text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-xl"
                  style={{ background: "rgba(15,15,40,0.98)", border: `1px solid ${badge.color}40` }}>
                  {badge.desc}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0"
                    style={{ borderLeft: "4px solid transparent", borderRight: "4px solid transparent", borderTop: `4px solid ${badge.color}40` }} />
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {unlockedCount === 0 && (
          <p className="text-center text-white/25 text-sm mt-4">
            MCQ সমাধান শুরু করুন এবং badges আনলক করুন 🚀
          </p>
        )}
      </div>
    </div>
  );
}
