import { motion } from "framer-motion";
import { useGetLeaderboard } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "wouter";
import { Trophy, Crown, Medal, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

function RankIcon({ rank }: { rank: number }) {
  if (rank === 1) return <Crown className="w-4 h-4 text-yellow-400" />;
  if (rank === 2) return <Medal className="w-4 h-4 text-slate-300" />;
  if (rank === 3) return <Medal className="w-4 h-4 text-amber-600" />;
  return <span className="text-xs font-bold text-white/30 w-4 text-center">#{rank}</span>;
}

export function MiniLeaderboard() {
  const { data: board, isLoading } = useGetLeaderboard();
  const { user } = useAuth();

  const top5 = board?.slice(0, 5) ?? [];

  return (
    <div>
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-sm font-bold text-white/40 uppercase tracking-widest flex items-center gap-2">
          <Trophy className="w-3.5 h-3.5" /> Leaderboard
        </h2>
        <Link href="/leaderboard">
          <span className="text-xs text-primary/70 hover:text-primary transition-colors flex items-center gap-1 cursor-pointer">
            সব দেখুন <ArrowRight className="w-3 h-3" />
          </span>
        </Link>
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-white/8 p-5"
        style={{ background: "linear-gradient(135deg, rgba(15,15,40,0.95) 0%, rgba(8,8,25,0.98) 100%)" }}>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 rounded-2xl" style={{ background: "rgba(255,255,255,0.05)" }} />
            ))}
          </div>
        ) : top5.length === 0 ? (
          <div className="text-center py-6 text-white/25 text-sm">
            এখনও কোনো ডেটা নেই। MCQ সমাধান শুরু করুন!
          </div>
        ) : (
          <div className="space-y-2">
            {top5.map((entry, i) => {
              const isMe = user && entry.userId === user.id;
              const rank = i + 1;
              const rankColors: Record<number, string> = { 1: "#fbbf24", 2: "#94a3b8", 3: "#d97706" };
              const rc = rankColors[rank];

              return (
                <motion.div
                  key={entry.userId}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className={`flex items-center gap-3 p-3 rounded-2xl transition-all ${
                    isMe
                      ? "border border-primary/30"
                      : "border border-transparent hover:border-white/10"
                  }`}
                  style={isMe
                    ? { background: "rgba(64,96,255,0.12)" }
                    : rank <= 3
                      ? { background: `${rc}08` }
                      : { background: "rgba(255,255,255,0.03)" }
                  }
                >
                  {/* Rank */}
                  <div className="w-7 flex items-center justify-center flex-shrink-0">
                    <RankIcon rank={rank} />
                  </div>

                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-extrabold text-white overflow-hidden"
                    style={isMe
                      ? { background: "var(--qovo-gradient)" }
                      : rc
                        ? { background: `${rc}30`, border: `1px solid ${rc}40` }
                        : { background: "rgba(255,255,255,0.08)" }
                    }>
                    {entry.avatarUrl
                      ? <img src={entry.avatarUrl} alt={entry.name} className="w-full h-full object-cover" />
                      : (entry.name?.[0] ?? "?").toUpperCase()
                    }
                  </div>

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold truncate ${isMe ? "text-primary" : "text-white/80"}`}>
                      {entry.name ?? "Unknown"} {isMe && <span className="text-[10px] text-primary/60">(আপনি)</span>}
                    </p>
                    <p className="text-[10px] text-white/30">{entry.level}</p>
                  </div>

                  {/* Score */}
                  <div className="text-right flex-shrink-0">
                    <p className={`text-sm font-extrabold ${rank === 1 ? "text-yellow-400" : rank === 2 ? "text-slate-300" : rank === 3 ? "text-amber-500" : "text-white/60"}`}>
                      {entry.totalPoints?.toLocaleString("bn-BD")}
                    </p>
                    <p className="text-[10px] text-white/25">XP</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        <Link href="/leaderboard">
          <motion.div whileHover={{ x: 3 }}
            className="mt-4 flex items-center justify-center gap-2 py-2.5 rounded-2xl border border-white/10 hover:border-primary/30 text-xs font-semibold text-white/40 hover:text-primary transition-all cursor-pointer">
            <Trophy className="w-3.5 h-3.5" /> সম্পূর্ণ লিডারবোর্ড দেখুন
            <ArrowRight className="w-3.5 h-3.5" />
          </motion.div>
        </Link>
      </div>
    </div>
  );
}
