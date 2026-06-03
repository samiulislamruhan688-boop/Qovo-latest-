import { useState, useEffect } from "react";
import { useListRecentAttempts } from "@workspace/api-client-react";
import { useRoute, Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Trophy, ArrowRight, CheckCircle2, XCircle, Brain, Clock,
  ChevronDown, ChevronUp, Sparkles, Target, Zap, BookOpen,
  TrendingUp, AlertCircle, Lightbulb,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface SessionData {
  testId: number;
  testTitle: string;
  questions: {
    id: number;
    questionText: string;
    options: string[];
    displayOrder: number[];
    hint?: string | null;
  }[];
  answers: Record<number, number>;
  timeTakenSeconds: number;
  flaggedIds: number[];
}

function PercentRing({ pct }: { pct: number }) {
  const r = 42;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  const color = pct >= 80 ? "#10b981" : pct >= 50 ? "#f97316" : "#ef4444";
  return (
    <svg width="110" height="110" viewBox="0 0 110 110">
      <circle cx="55" cy="55" r={r} fill="none" stroke="currentColor" strokeWidth="10" className="text-muted/30" />
      <motion.circle cx="55" cy="55" r={r} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={circ}
        animate={{ strokeDashoffset: circ - dash }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        transform="rotate(-90 55 55)" />
      <text x="55" y="60" textAnchor="middle" fontSize="20" fontWeight="bold" fill={color}>{pct}%</text>
    </svg>
  );
}

/** Parse markdown-like text into structured display */
function RenderAnalysis({ text }: { text: string }) {
  const lines = text.split("\n").filter((l) => l.trim());
  return (
    <div className="space-y-2">
      {lines.map((line, i) => {
        const cleaned = line.replace(/^#+\s*/, "").replace(/\*\*(.*?)\*\*/g, "$1");
        if (line.startsWith("##") || line.startsWith("**")) {
          return <p key={i} className="font-bold text-foreground text-sm mt-3 first:mt-0">{cleaned}</p>;
        }
        if (line.startsWith("- ") || line.startsWith("* ") || line.startsWith("• ")) {
          return (
            <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
              <span className="mt-1 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
              <span className="leading-relaxed">{line.replace(/^[-*•]\s*/, "")}</span>
            </div>
          );
        }
        if (line.trim().length === 0) return null;
        return <p key={i} className="text-sm text-muted-foreground leading-relaxed">{cleaned}</p>;
      })}
    </div>
  );
}

export default function TestResult() {
  const [, params] = useRoute("/tests/:testId/result");
  const testId = Number(params?.testId);

  const { data: attempts, isLoading } = useListRecentAttempts();
  const attempt = attempts?.find((a) => a.testId === testId);

  const [session, setSession] = useState<SessionData | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string>("");
  const [aiLoading, setAiLoading] = useState(false);
  const [expandedQ, setExpandedQ] = useState<Set<number>>(new Set());

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("qovo_test_session");
      if (raw) {
        const data = JSON.parse(raw) as SessionData;
        if (data.testId === testId) setSession(data);
      }
    } catch { /* ignore */ }
  }, [testId]);

  useEffect(() => {
    if (!attempt || !session || aiAnalysis) return;

    const wrongQuestions = session.questions.filter((q) => {
      const picked = session.answers[q.id];
      return picked !== undefined && picked !== q.options.indexOf(q.options[picked]);
    });

    const wrongDetails = wrongQuestions.slice(0, 8).map((q) => {
      const picked = session.answers[q.id];
      return `• "${q.questionText.slice(0, 60)}…" — উত্তর: "${q.options[picked] ?? "?"}"`;
    });

    const timePerQ = session.timeTakenSeconds / (session.questions.length || 1);
    const grade = attempt.accuracy >= 80 ? "চমৎকার" : attempt.accuracy >= 60 ? "ভালো" : attempt.accuracy >= 40 ? "গড়পড়তা" : "দুর্বল";

    const prompt = `তুমি Qovo-র AI শিক্ষা-কোচ। একজন SSC পরীক্ষার্থী "${attempt.testTitle}" মডেল টেস্ট সম্পন্ন করেছে।

## পরীক্ষার তথ্য:
- মোট প্রশ্ন: ${attempt.totalQuestions}
- সঠিক উত্তর: ${attempt.score}
- ভুল উত্তর: ${attempt.totalQuestions - attempt.score}
- সঠিকতা: ${Math.round(attempt.accuracy)}% (${grade} স্তর)
- সময়: ${Math.floor(session.timeTakenSeconds / 60)} মিনিট ${session.timeTakenSeconds % 60} সেকেন্ড
- প্রতি প্রশ্নে গড় সময়: ${Math.round(timePerQ)} সেকেন্ড

${wrongDetails.length > 0 ? `## ভুল উত্তরসমূহ (${wrongQuestions.length}টি):\n${wrongDetails.join("\n")}` : "## সব প্রশ্নের উত্তর সঠিক!"}

## নির্দেশনা:
বাংলায় বিস্তারিত বিশ্লেষণ দাও। নিচের সেকশনগুলো অন্তর্ভুক্ত করো:

**পারফরম্যান্স মূল্যায়ন:**
(সততার সাথে সংক্ষিপ্ত মূল্যায়ন)

**শক্তিশালী দিক:**
(কী ভালো করেছে)

**উন্নতির ক্ষেত্র:**
(কোথায় সমস্যা)

**আগামীর পদক্ষেপ:**
- (নির্দিষ্ট পরামর্শ ১)
- (নির্দিষ্ট পরামর্শ ২)
- (নির্দিষ্ট পরামর্শ ৩)

**SSC প্রস্তুতি স্তর:** (১০ এর মধ্যে সম্ভাব্য স্কোর)

markdown ব্যবহার করো। উৎসাহজনক কিন্তু সৎ ও কাজের কথা বলো। কোনো emoji ব্যবহার করো না।`;

    setAiLoading(true);
    const base = import.meta.env.BASE_URL.replace(/\/$/, "");
    fetch(`${base}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: prompt }),
    })
      .then((r) => r.json())
      .then((d) => setAiAnalysis(d.reply ?? ""))
      .catch(() => setAiAnalysis("AI বিশ্লেষণ এই মুহূর্তে পাওয়া যাচ্ছে না।"))
      .finally(() => setAiLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt, session]);

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-64 w-full rounded-3xl" />
        <div className="grid grid-cols-2 gap-4">
          {[1,2,3,4].map((i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="max-w-md mx-auto text-center py-20">
        <h2 className="text-2xl font-bold mb-4">ফলাফল পাওয়া যায়নি</h2>
        <Link href="/tests"><Button>টেস্ট তালিকায় ফিরে যান</Button></Link>
      </div>
    );
  }

  const pct = Math.round(attempt.accuracy);
  const grade = pct >= 80 ? { label: "অসাধারণ!", color: "text-emerald-500", bg: "bg-emerald-500" }
    : pct >= 60 ? { label: "ভালো করেছ", color: "text-primary", bg: "bg-primary" }
    : pct >= 40 ? { label: "মোটামুটি", color: "text-orange-500", bg: "bg-orange-500" }
    : { label: "আরও পড়তে হবে", color: "text-destructive", bg: "bg-destructive" };

  const timeMins = session ? Math.floor(session.timeTakenSeconds / 60) : 0;
  const timeSecs = session ? session.timeTakenSeconds % 60 : 0;
  const timePerQ = session ? Math.round(session.timeTakenSeconds / (session.questions.length || 1)) : 0;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* ── Hero result card ── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="overflow-hidden">
          <div className="h-1.5 qovo-gradient" />
          <CardContent className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="flex flex-col items-center gap-2 flex-shrink-0">
                <PercentRing pct={pct} />
                <p className={cn("text-lg font-bold", grade.color)}>{grade.label}</p>
              </div>
              <div className="flex-1 space-y-4 w-full">
                <div>
                  <h1 className="text-xl font-bold text-foreground mb-0.5">টেস্ট সম্পন্ন!</h1>
                  <p className="text-sm text-muted-foreground">{attempt.testTitle}</p>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { label: "সঠিক", value: String(attempt.score), icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
                    { label: "ভুল",  value: String(attempt.totalQuestions - attempt.score), icon: XCircle, color: "text-destructive", bg: "bg-red-50 dark:bg-red-950/30" },
                    { label: "সময়",  value: `${timeMins}:${timeSecs.toString().padStart(2,"0")}`, icon: Clock, color: "text-muted-foreground", bg: "bg-muted/50" },
                    { label: "প্রতি প্রশ্ন", value: `${timePerQ}সে`, icon: Zap, color: "text-primary", bg: "bg-primary/10" },
                  ].map(({ label, value, icon: Icon, color, bg }) => (
                    <div key={label} className={cn("flex items-center gap-2.5 p-3 rounded-xl", bg)}>
                      <Icon className={cn("w-4 h-4 flex-shrink-0", color)} />
                      <div>
                        <p className={cn("text-base font-bold leading-none", color)}>{value}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── AI Analysis ── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <Card className="border-primary/20 overflow-hidden">
          <div className="h-0.5 qovo-gradient" />
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-9 h-9 rounded-xl qovo-gradient flex items-center justify-center flex-shrink-0">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-base">AI পারফরম্যান্স বিশ্লেষণ</h2>
                <p className="text-xs text-muted-foreground">ব্যক্তিগতকৃত মূল্যায়ন ও পরামর্শ</p>
              </div>
              <Sparkles className="w-4 h-4 text-primary ml-auto animate-pulse" />
            </div>

            {aiLoading ? (
              <div className="space-y-6">
                {/* Loading skeleton that mimics the structure */}
                <div className="space-y-2">
                  <Skeleton className="h-3.5 w-40" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-3.5 w-32" />
                  <Skeleton className="h-4 w-4/5" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-3.5 w-36" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-4/5" />
                </div>
              </div>
            ) : aiAnalysis ? (
              <div className="space-y-4">
                <RenderAnalysis text={aiAnalysis} />
                {/* Quick insight chips */}
                <div className="flex flex-wrap gap-2 pt-3 border-t border-border">
                  <div className={cn("flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-full",
                    pct >= 70 ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30" : "bg-orange-50 text-orange-700 dark:bg-orange-950/30")}>
                    <Target className="w-3.5 h-3.5" />
                    সঠিকতা {pct}%
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/30">
                    <Clock className="w-3.5 h-3.5" />
                    প্রতি প্রশ্ন {timePerQ}সে
                  </div>
                  <div className={cn("flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-full",
                    timePerQ <= 45 ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30" : "bg-amber-50 text-amber-700 dark:bg-amber-950/30")}>
                    <TrendingUp className="w-3.5 h-3.5" />
                    {timePerQ <= 45 ? "গতি ভালো" : "গতি বাড়াও"}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground text-sm py-4">
                <AlertCircle className="w-4 h-4" />
                বিশ্লেষণ পাওয়া যায়নি।
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Per-question review ── */}
      {session && session.questions.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              প্রশ্নভিত্তিক ফলাফল
            </h2>
            <span className="text-xs text-muted-foreground">ক্লিক করলে বিস্তারিত দেখা যাবে</span>
          </div>
          <div className="space-y-2.5">
            {session.questions.map((q, idx) => {
              const pickedOriginal = session.answers[q.id];
              const notAnswered = pickedOriginal === undefined;
              const isExpanded = expandedQ.has(q.id);
              const isFlagged = session.flaggedIds.includes(q.id);
              const pickedText = notAnswered ? null : q.options[pickedOriginal];
              const isCorrect = !notAnswered && pickedOriginal === q.options.indexOf(q.options[pickedOriginal]);

              return (
                <motion.div key={q.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.03 * Math.min(idx, 10) }}>
                  <Card
                    className={cn("border overflow-hidden cursor-pointer transition-all hover:shadow-sm",
                      notAnswered ? "border-muted" : isCorrect ? "border-l-4 border-l-emerald-500" : "border-l-4 border-l-destructive")}
                    onClick={() => setExpandedQ((prev) => { const n = new Set(prev); n.has(q.id) ? n.delete(q.id) : n.add(q.id); return n; })}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={cn("flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mt-0.5",
                          notAnswered ? "bg-muted text-muted-foreground" : isCorrect ? "bg-emerald-500 text-white" : "bg-destructive text-white")}>
                          {notAnswered ? "—" : isCorrect ? "✓" : "✗"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-foreground leading-snug">
                            {idx + 1}. {q.questionText}
                            {isFlagged && <span className="ml-2 text-xs text-orange-500 font-medium">ফ্ল্যাগড</span>}
                          </p>
                          {!isExpanded && pickedText && (
                            <p className={cn("text-xs mt-1", isCorrect ? "text-emerald-600" : "text-destructive")}>
                              তুমি বেছেছিলে: {pickedText}
                            </p>
                          )}
                        </div>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
                          : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />}
                      </div>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                            <div className="mt-3 pt-3 border-t border-border space-y-2 pl-10">
                              {q.displayOrder.map((origIdx, dispIdx) => {
                                const optText = q.options[origIdx];
                                const isPicked = pickedOriginal === origIdx;
                                return (
                                  <div key={dispIdx} className={cn("flex items-center gap-2 p-2.5 rounded-xl text-sm transition-colors",
                                    isPicked && isCorrect && "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700",
                                    isPicked && !isCorrect && "bg-red-50 dark:bg-red-950/30 text-destructive")}>
                                    <span className="w-5 h-5 rounded-full border flex items-center justify-center text-xs font-semibold flex-shrink-0">
                                      {String.fromCharCode(65 + dispIdx)}
                                    </span>
                                    <span className="flex-1">{optText}</span>
                                    {isPicked && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                                    {isPicked && !isCorrect && <XCircle className="w-4 h-4 text-destructive" />}
                                  </div>
                                );
                              })}
                              {notAnswered && <p className="text-xs text-muted-foreground italic">এই প্রশ্নের উত্তর দেওয়া হয়নি।</p>}
                              {q.hint && (
                                <div className="mt-2 flex items-start gap-2 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-100 text-xs">
                                  <Lightbulb className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                                  {q.hint}
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Actions */}
      <div className="flex justify-center gap-4 pt-2">
        <Link href="/tests"><Button variant="outline" size="lg">আরেকটি টেস্ট</Button></Link>
        <Link href="/progress">
          <Button size="lg" className="qovo-gradient text-white border-0">
            প্রগতি দেখুন <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
