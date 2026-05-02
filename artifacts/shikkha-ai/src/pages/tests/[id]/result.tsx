import { useState, useEffect } from "react";
import { useListRecentAttempts } from "@workspace/api-client-react";
import { useRoute, Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Trophy,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Brain,
  Clock,
  ChevronDown,
  ChevronUp,
  Sparkles,
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
      <motion.circle
        cx="55"
        cy="55"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={circ}
        animate={{ strokeDashoffset: circ - dash }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        transform="rotate(-90 55 55)"
      />
      <text x="55" y="60" textAnchor="middle" fontSize="20" fontWeight="bold" fill={color}>
        {pct}%
      </text>
    </svg>
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
    } catch {
      // ignore
    }
  }, [testId]);

  useEffect(() => {
    if (!attempt || !session || aiAnalysis) return;
    const wrong = session.questions.filter((q) => session.answers[q.id] !== undefined);
    const wrongDetails = wrong
      .filter((q) => {
        const picked = session.answers[q.id];
        return picked !== undefined;
      })
      .map((q) => {
        const picked = session.answers[q.id];
        return `• "${q.questionText}" — বেছেছিলে: "${q.options[picked] ?? "উত্তর দেননি"}"`;
      })
      .slice(0, 10);

    const prompt = `তুমি Qovo-র AI টিউটর। একজন SSC পরীক্ষার্থী "${attempt.testTitle}" মডেল টেস্ট দিয়েছে।

ফলাফল:
- মোট প্রশ্ন: ${attempt.totalQuestions}
- সঠিক: ${attempt.score}
- ভুল: ${attempt.totalQuestions - attempt.score}
- সঠিকতা: ${Math.round(attempt.accuracy)}%
- সময়: ${Math.floor(session.timeTakenSeconds / 60)} মিনিট ${session.timeTakenSeconds % 60} সেকেন্ড

${wrongDetails.length > 0 ? `কিছু ভুল উত্তর:\n${wrongDetails.join("\n")}` : ""}

বাংলায় ৪-৫ লাইনে বলো:
১. পারফরম্যান্স কেমন হয়েছে (emoji সহ সৎভাবে)
২. কোথায় দুর্বলতা মনে হচ্ছে
৩. পরবর্তী পদক্ষেপ কী হবে (নির্দিষ্ট পরামর্শ)

markdown ব্যবহার করো। সংক্ষিপ্ত, উৎসাহমূলক ও কাজের কথা বলো।`;

    setAiLoading(true);
    fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: prompt }),
    })
      .then((r) => r.json())
      .then((d) => setAiAnalysis(d.reply ?? ""))
      .catch(() => setAiAnalysis("AI বিশ্লেষণ এখন পাওয়া যাচ্ছে না।"))
      .finally(() => setAiLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt, session]);

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-64 w-full rounded-3xl" />
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
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
  const grade = pct >= 80 ? { label: "অসাধারণ! 🏆", color: "text-emerald-500" }
    : pct >= 60 ? { label: "ভালো! 👍", color: "text-primary" }
    : pct >= 40 ? { label: "মোটামুটি 📚", color: "text-orange-500" }
    : { label: "আরও পড়তে হবে 💪", color: "text-destructive" };

  const timeMins = session ? Math.floor(session.timeTakenSeconds / 60) : 0;
  const timeSecs = session ? session.timeTakenSeconds % 60 : 0;

  const toggleQ = (id: number) => {
    setExpandedQ((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      {/* Hero result card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="overflow-hidden">
          <div className="h-1.5 qovo-gradient" />
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-20 h-20 mx-auto qovo-gradient rounded-full flex items-center justify-center qovo-glow">
              <Trophy className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">টেস্ট সম্পন্ন!</h1>
            <p className="text-muted-foreground">{attempt.testTitle}</p>

            <div className="flex items-center justify-center gap-8 py-4">
              <PercentRing pct={pct} />
              <div className="text-left space-y-3">
                <div>
                  <p className={cn("text-2xl font-bold", grade.color)}>{grade.label}</p>
                </div>
                <div className="space-y-1 text-sm">
                  <p className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" /> {attempt.score} সঠিক
                  </p>
                  <p className="flex items-center gap-2 text-destructive">
                    <XCircle className="w-4 h-4" /> {attempt.totalQuestions - attempt.score} ভুল
                  </p>
                  {session && (
                    <p className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      {timeMins}:{timeSecs.toString().padStart(2, "0")} মিনিট
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "স্কোর", value: `${attempt.score}/${attempt.totalQuestions}`, color: "bg-primary/10 text-primary" },
                { label: "সঠিকতা", value: `${pct}%`, color: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600" },
                { label: "সময়", value: `${timeMins}মি`, color: "bg-muted text-muted-foreground" },
              ].map(({ label, value, color }) => (
                <div key={label} className={cn("rounded-xl p-3 text-center", color)}>
                  <p className="text-lg font-bold">{value}</p>
                  <p className="text-xs opacity-80 mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* AI Analysis */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card className="border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full qovo-gradient flex items-center justify-center">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <h2 className="font-bold text-lg">AI পারফরম্যান্স বিশ্লেষণ</h2>
              <Sparkles className="w-4 h-4 text-primary ml-auto" />
            </div>
            {aiLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/6" />
              </div>
            ) : aiAnalysis ? (
              <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground leading-relaxed">
                {aiAnalysis.split("\n").map((line, i) => (
                  <p key={i} className={line.startsWith("#") ? "font-bold text-foreground" : ""}>
                    {line}
                  </p>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">বিশ্লেষণ পাওয়া যায়নি।</p>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Per-question review */}
      {session && session.questions.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            প্রশ্নভিত্তিক ফলাফল
            <span className="text-sm font-normal text-muted-foreground">— ক্লিক করলে ব্যাখ্যা দেখা যাবে</span>
          </h2>
          <div className="space-y-3">
            {session.questions.map((q, idx) => {
              const pickedOriginal = session.answers[q.id];
              const notAnswered = pickedOriginal === undefined;
              const isExpanded = expandedQ.has(q.id);
              const isFlagged = session.flaggedIds.includes(q.id);

              const pickedText = notAnswered ? null : q.options[pickedOriginal];
              const isCorrect = !notAnswered && pickedOriginal === q.options.indexOf(q.options[pickedOriginal]);

              return (
                <motion.div
                  key={q.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * idx }}
                >
                  <Card
                    className={cn(
                      "border overflow-hidden cursor-pointer",
                      notAnswered
                        ? "border-muted"
                        : "border-l-4",
                      !notAnswered && isCorrect && "border-l-emerald-500",
                      !notAnswered && !isCorrect && "border-l-destructive",
                    )}
                    onClick={() => toggleQ(q.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            "flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mt-0.5",
                            notAnswered
                              ? "bg-muted text-muted-foreground"
                              : isCorrect
                                ? "bg-emerald-500 text-white"
                                : "bg-destructive text-white",
                          )}
                        >
                          {notAnswered ? "—" : isCorrect ? "✓" : "✗"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-foreground leading-snug">
                            {idx + 1}. {q.questionText}
                            {isFlagged && (
                              <span className="ml-2 text-xs text-orange-500">🚩 ফ্ল্যাগড</span>
                            )}
                          </p>
                          {!isExpanded && pickedText && (
                            <p className={cn("text-xs mt-1", isCorrect ? "text-emerald-600" : "text-destructive")}>
                              তুমি বেছেছিলে: {pickedText}
                            </p>
                          )}
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
                        )}
                      </div>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-4 space-y-2 pl-10">
                              {q.displayOrder.map((origIdx, dispIdx) => {
                                const optText = q.options[origIdx];
                                const isPicked = pickedOriginal === origIdx;
                                const isThisCorrect = notAnswered
                                  ? false
                                  : origIdx === q.options.indexOf(q.options[pickedOriginal!]);

                                return (
                                  <div
                                    key={dispIdx}
                                    className={cn(
                                      "flex items-center gap-2 p-2 rounded-lg text-sm",
                                      isPicked && isCorrect && "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700",
                                      isPicked && !isCorrect && "bg-red-50 dark:bg-red-950/30 text-destructive",
                                    )}
                                  >
                                    <span className="w-5 h-5 rounded-full border flex items-center justify-center text-xs font-medium flex-shrink-0">
                                      {String.fromCharCode(65 + dispIdx)}
                                    </span>
                                    <span className="flex-1">{optText}</span>
                                    {isPicked && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                                    {isPicked && !isCorrect && <XCircle className="w-4 h-4 text-destructive" />}
                                  </div>
                                );
                              })}
                              {notAnswered && (
                                <p className="text-xs text-muted-foreground italic">এই প্রশ্নের উত্তর দেওয়া হয়নি।</p>
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
      <div className="flex justify-center gap-4 pt-4">
        <Link href="/tests">
          <Button variant="outline" size="lg">আরেকটি টেস্ট</Button>
        </Link>
        <Link href="/progress">
          <Button size="lg" className="qovo-gradient text-white border-0">
            প্রগতি দেখুন <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
