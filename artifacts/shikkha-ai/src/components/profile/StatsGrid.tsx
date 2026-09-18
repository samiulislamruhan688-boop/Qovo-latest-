import { motion } from "framer-motion";
import { useGetProgressSummary, useGetStreak } from "@workspace/api-client-react";
import { Trophy, Target, Brain, Flame, BookOpen, FileText, TrendingUp, Star, Zap, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number | undefined;
  sub?: string;
  color: string;
  delay?: number;
}

function StatCard({ icon, label, value, sub, color, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.4 }}
      whileHover={{ y: -2, scale: 1.02 }}
      className="relative overflow-hidden rounded-2xl p-4 border border-white/8 group cursor-default"
      style={{ background: "linear-gradient(135deg, rgba(20,20,50,0.9) 0%, rgba(12,12,35,0.95) 100%)" }}
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: `radial-gradient(circle at 50% 50%, ${color}12 0%, transparent 70%)` }} />
      <div className="relative z-10">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
          style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
          <span style={{ color }}>{icon}</span>
        </div>
        {value === undefined ? (
          <Skeleton className="h-7 w-16 mb-1" style={{ background: "rgba(255,255,255,0.07)" }} />
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xl md:text-2xl font-extrabold text-white leading-none mb-1"
          >
            {value}
          </motion.div>
        )}
        <div className="text-xs text-white/40 font-medium leading-tight">{label}</div>
        {sub && <div className="text-[10px] text-white/25 mt-0.5">{sub}</div>}
      </div>
    </motion.div>
  );
}

export function StatsGrid() {
  const { data: summary } = useGetProgressSummary();
  const { data: streak } = useGetStreak();

  const accuracy = summary?.accuracy ?? 0;
  const studyHours = Math.round((summary?.totalAnswered ?? 0) * 1.2 / 60);

  const stats = [
    {
      icon: <Trophy className="w-4.5 h-4.5" />,
      label: "মোট পয়েন্ট",
      value: summary?.totalPoints?.toLocaleString("bn-BD"),
      color: "#f59e0b",
    },
    {
      icon: <Target className="w-4.5 h-4.5" />,
      label: "সঠিক উত্তর",
      value: summary?.totalCorrect?.toLocaleString("bn-BD"),
      color: "#10b981",
    },
    {
      icon: <Brain className="w-4.5 h-4.5" />,
      label: "সঠিকতার হার",
      value: summary ? `${Math.round(accuracy)}%` : undefined,
      color: "#818cf8",
    },
    {
      icon: <Flame className="w-4.5 h-4.5" />,
      label: "বর্তমান স্ট্রিক",
      value: streak ? `${streak.currentStreak}d` : undefined,
      sub: "পরপর দিন",
      color: "#f97316",
    },
    {
      icon: <Star className="w-4.5 h-4.5" />,
      label: "সর্বোচ্চ স্ট্রিক",
      value: streak ? `${streak.longestStreak}d` : undefined,
      sub: "রেকর্ড",
      color: "#fbbf24",
    },
    {
      icon: <BookOpen className="w-4.5 h-4.5" />,
      label: "মোট MCQ",
      value: summary?.totalAnswered?.toLocaleString("bn-BD"),
      sub: "সমাধান করা",
      color: "#60a5fa",
    },
    {
      icon: <FileText className="w-4.5 h-4.5" />,
      label: "মডেল টেস্ট",
      value: summary?.testsCompleted?.toLocaleString("bn-BD"),
      sub: "সম্পন্ন",
      color: "#a78bfa",
    },
    {
      icon: <TrendingUp className="w-4.5 h-4.5" />,
      label: "লেভেল",
      value: summary?.level,
      color: "#34d399",
    },
    {
      icon: <Zap className="w-4.5 h-4.5" />,
      label: "র‍্যাংক",
      value: summary?.rank ? `#${summary.rank}` : undefined,
      sub: "জাতীয়",
      color: "#e879f9",
    },
    {
      icon: <Clock className="w-4.5 h-4.5" />,
      label: "অনুমানিত সময়",
      value: studyHours > 0 ? `${studyHours}h` : "—",
      sub: "মোট অনুশীলন",
      color: "#94a3b8",
    },
  ];

  return (
    <div>
      <h2 className="text-sm font-bold text-white/40 uppercase tracking-widest mb-3 px-1">Quick Stats</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {stats.map((s, i) => (
          <StatCard key={s.label} {...s} delay={i * 0.04} />
        ))}
      </div>
    </div>
  );
}
