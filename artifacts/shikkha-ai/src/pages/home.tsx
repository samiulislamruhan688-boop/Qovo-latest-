import { useState, useEffect } from "react";
import {
  useGetProgressSummary,
  useListRecentAttempts,
  useGetActivityFeed,
} from "@workspace/api-client-react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Brain, Target, Trophy, Clock, ArrowRight, Flame, BookOpen, FileText, Zap, BookmarkCheck, ChevronLeft, ChevronRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { getWrongAnswerCount } from "@/hooks/useWrongAnswers";

const BANNERS = [
  {
    id: 1,
    emoji: "🚀",
    title: "দ্রুত MCQ অনুশীলন করো",
    desc: "প্রতিদিন ৩০ মিনিট অনুশীলনেই SSC তে ভালো ফল করা সম্ভব।",
    bg: "from-blue-600 to-cyan-500",
    link: "/subjects",
    cta: "শুরু করো →",
  },
  {
    id: 2,
    emoji: "📝",
    title: "মডেল টেস্ট দাও আজই",
    desc: "বিষয়ভিত্তিক মডেল টেস্টে নিজের দুর্বলতা খুঁজে বের করো।",
    bg: "from-purple-600 to-pink-500",
    link: "/tests",
    cta: "টেস্ট দাও →",
  },
  {
    id: 3,
    emoji: "🤖",
    title: "AI টিউটরকে জিজ্ঞেস করো",
    desc: "যেকোনো প্রশ্নের বিস্তারিত ব্যাখ্যা পাও বাংলায় — বিনামূল্যে।",
    bg: "from-teal-600 to-emerald-500",
    link: "/chat",
    cta: "টিউটর খোলো →",
  },
  {
    id: 4,
    emoji: "💡",
    title: "ভুল উত্তরগুলো রিভিউ করো",
    desc: "আগের ভুল থেকে শেখো — Saved প্রশ্নগুলো রিভিউ করে নাও।",
    bg: "from-orange-500 to-amber-400",
    link: "/review",
    cta: "রিভিউ করো →",
  },
];

function BannerSlider() {
  const [current, setCurrent] = useState(0);
  const [dir, setDir] = useState(1);

  useEffect(() => {
    const timer = setInterval(() => {
      setDir(1);
      setCurrent((c) => (c + 1) % BANNERS.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const goTo = (idx: number) => {
    setDir(idx > current ? 1 : -1);
    setCurrent(idx);
  };
  const prev = () => { setDir(-1); setCurrent((c) => (c - 1 + BANNERS.length) % BANNERS.length); };
  const next = () => { setDir(1); setCurrent((c) => (c + 1) % BANNERS.length); };

  const b = BANNERS[current];

  return (
    <div className="relative overflow-hidden rounded-2xl h-32 md:h-36 select-none">
      <AnimatePresence mode="wait" custom={dir}>
        <motion.div
          key={b.id}
          custom={dir}
          variants={{
            enter: (d: number) => ({ x: d * 80, opacity: 0 }),
            center: { x: 0, opacity: 1 },
            exit: (d: number) => ({ x: d * -80, opacity: 0 }),
          }}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.35, ease: "easeOut" }}
          className={cn("absolute inset-0 bg-gradient-to-r text-white rounded-2xl p-5 md:p-6 flex items-center justify-between", b.bg)}
        >
          <div className="flex-1 min-w-0">
            <p className="text-3xl mb-1">{b.emoji}</p>
            <h3 className="font-bold text-base md:text-lg leading-tight">{b.title}</h3>
            <p className="text-white/80 text-xs md:text-sm mt-0.5 leading-snug line-clamp-2">{b.desc}</p>
          </div>
          <Link href={b.link} className="ml-4 flex-shrink-0">
            <span className="inline-block bg-white/20 hover:bg-white/30 backdrop-blur text-white text-xs font-bold px-4 py-2 rounded-full transition-colors whitespace-nowrap">
              {b.cta}
            </span>
          </Link>
        </motion.div>
      </AnimatePresence>

      <button
        type="button"
        onClick={prev}
        className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center z-10 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={next}
        className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center z-10 transition-colors"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
        {BANNERS.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => goTo(i)}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              i === current ? "w-5 bg-white" : "w-1.5 bg-white/50",
            )}
          />
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const { data: summary, isLoading: loadingSummary } = useGetProgressSummary();
  const { data: recentAttempts, isLoading: loadingAttempts } = useListRecentAttempts();
  const { data: activities, isLoading: loadingActivities } = useGetActivityFeed();
  const wrongCount = getWrongAnswerCount();

  return (
    <div className="max-w-5xl mx-auto space-y-7">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl qovo-gradient-soft border border-border/50 p-7 md:p-10">
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full qovo-gradient opacity-10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-10 w-72 h-72 rounded-full bg-secondary opacity-10 blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-card/80 border border-border text-xs font-semibold text-foreground mb-4 shadow-sm backdrop-blur">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            SSC ২০২৬ — সুপারফাস্ট প্রস্তুতি
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-3 leading-tight">
            <span className="qovo-gradient-text">Qovo</span>
            <span className="text-foreground"> দিয়ে আজই শুরু করো</span>
          </h1>
          <p className="text-base text-muted-foreground mb-6">
            এলোমেলো MCQ অনুশীলন, স্মার্ট হিন্ট, মডেল টেস্ট ও AI টিউটর — সম্পূর্ণ বিনামূল্যে।
          </p>
          <div className="flex flex-wrap gap-2.5">
            <Link href="/subjects" className="inline-flex items-center justify-center px-5 py-2.5 rounded-full qovo-gradient text-white font-semibold text-sm qovo-glow hover:scale-105 transition-transform">
              <BookOpen className="w-4 h-4 mr-2" /> পড়া শুরু করো
            </Link>
            <Link href="/tests" className="inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-card text-foreground font-semibold text-sm border border-border hover:border-primary/50 transition-colors shadow-sm">
              <FileText className="w-4 h-4 mr-2" /> মডেল টেস্ট দাও
            </Link>
            <Link href="/chat" className="inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-secondary/10 text-secondary font-semibold text-sm border border-secondary/30 hover:bg-secondary/20 transition-colors">
              <Brain className="w-4 h-4 mr-2" /> AI টিউটর
            </Link>
          </div>
        </div>
      </section>

      {/* Banner Slider */}
      <BannerSlider />

      {/* Quick Actions */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "MCQ অনুশীলন", icon: <Zap className="w-5 h-5" />, href: "/subjects", color: "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900" },
          { label: "মডেল টেস্ট", icon: <FileText className="w-5 h-5" />, href: "/tests", color: "bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-900" },
          { label: "AI টিউটর", icon: <Brain className="w-5 h-5" />, href: "/chat", color: "bg-teal-50 dark:bg-teal-950/30 text-teal-600 dark:text-teal-400 border-teal-200 dark:border-teal-900" },
          {
            label: `রিভিউ লিস্ট${wrongCount > 0 ? ` (${wrongCount})` : ""}`,
            icon: <BookmarkCheck className="w-5 h-5" />,
            href: "/review",
            color: "bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-900",
          },
        ].map(({ label, icon, href, color }) => (
          <Link key={href} href={href}>
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className={cn("flex flex-col items-center gap-2 p-4 rounded-2xl border text-center cursor-pointer transition-all", color)}
            >
              {icon}
              <span className="text-xs font-semibold">{label}</span>
            </motion.div>
          </Link>
        ))}
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="মোট পয়েন্ট" value={summary?.totalPoints} icon={<Trophy className="w-5 h-5 text-yellow-500" />} loading={loadingSummary} />
        <StatCard title="সঠিক উত্তর" value={summary?.totalCorrect} icon={<Target className="w-5 h-5 text-emerald-500" />} loading={loadingSummary} />
        <StatCard title="সঠিকতার হার" value={summary ? `${Math.round(summary.accuracy)}%` : undefined} icon={<Brain className="w-5 h-5 text-primary" />} loading={loadingSummary} />
        <StatCard title="বর্তমান লেভেল" value={summary?.level} icon={<Flame className="w-5 h-5 text-orange-500" />} loading={loadingSummary} />
      </section>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card className="border-none shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" /> সাম্প্রতিক কার্যক্রম
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingActivities ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
              </div>
            ) : activities?.length ? (
              <div className="space-y-3">
                {activities.slice(0, 5).map((activity) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border border-border/50"
                  >
                    <div>
                      <p className="font-semibold text-sm text-foreground">{activity.title}</p>
                      <p className="text-xs text-muted-foreground">{activity.detail}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-primary text-sm">+{activity.points}</span>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-30" />
                এখনও কোনো কার্যক্রম নেই।{" "}
                <Link href="/subjects" className="text-primary hover:underline">পড়া শুরু করুন!</Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Tests */}
        <Card className="border-none shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5 text-secondary" /> সাম্প্রতিক মডেল টেস্ট
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingAttempts ? (
              <div className="space-y-3">
                {[1, 2].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
              </div>
            ) : recentAttempts?.length ? (
              <div className="space-y-3">
                {recentAttempts.slice(0, 3).map((attempt) => {
                  const pct = Math.round(attempt.accuracy);
                  const color = pct >= 80 ? "text-emerald-500" : pct >= 50 ? "text-orange-500" : "text-destructive";
                  return (
                    <Link key={attempt.id} href={`/tests/${attempt.testId}/result`}>
                      <motion.div
                        whileHover={{ x: 3 }}
                        className="group flex items-center justify-between p-3 rounded-xl bg-card border border-border hover:border-secondary transition-colors cursor-pointer"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-sm text-foreground truncate group-hover:text-secondary transition-colors">
                            {attempt.testTitle}
                          </p>
                          <p className={cn("text-xs font-semibold", color)}>{pct}% সঠিক</p>
                        </div>
                        <div className="flex items-center gap-3 ml-3">
                          <div className="text-right">
                            <p className="font-bold text-base">{attempt.score}<span className="text-muted-foreground text-xs">/{attempt.totalQuestions}</span></p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-secondary transition-colors" />
                        </div>
                      </motion.div>
                    </Link>
                  );
                })}
                <Link href="/tests" className="block text-center text-xs text-primary hover:underline pt-1">
                  সব টেস্ট দেখুন →
                </Link>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                এখনও কোনো টেস্ট দেননি।{" "}
                <Link href="/tests" className="text-primary hover:underline">টেস্ট দিন</Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, loading }: { title: string; value?: string | number; icon: React.ReactNode; loading: boolean }) {
  return (
    <motion.div whileHover={{ scale: 1.02 }}>
      <Card className="border-none shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-2 text-muted-foreground">
            {icon}
            <span className="font-medium text-xs">{title}</span>
          </div>
          {loading ? (
            <Skeleton className="h-8 w-20" />
          ) : (
            <div className="text-2xl md:text-3xl font-bold text-foreground">{value ?? 0}</div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
