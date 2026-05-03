import { useState, useEffect, useRef } from "react";
import { useRoute, useLocation, Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Clock,
  Flag,
  Lightbulb,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Minus,
  Plus,
  Brain,
  Trophy,
  XCircle,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { playHush, playCorrect, playWrong } from "@/hooks/useSound";

interface QuestionRow {
  id: number;
  questionText: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  hint?: string | null;
  difficulty: string;
  chapterId: number;
}

interface ShuffledQ extends QuestionRow {
  displayOrder: number[];
}

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

type Phase = "setup" | "exam" | "result";

function PercentRing({ pct }: { pct: number }) {
  const r = 38;
  const circ = 2 * Math.PI * r;
  const color = pct >= 80 ? "#10b981" : pct >= 50 ? "#f97316" : "#ef4444";
  return (
    <svg width="100" height="100" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r={r} fill="none" stroke="currentColor" strokeWidth="9" className="text-muted/30" />
      <motion.circle
        cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="9"
        strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ}
        animate={{ strokeDashoffset: circ - (pct / 100) * circ }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        transform="rotate(-90 50 50)"
      />
      <text x="50" y="55" textAnchor="middle" fontSize="18" fontWeight="bold" fill={color}>{pct}%</text>
    </svg>
  );
}

export default function SubjectTest() {
  const [, params] = useRoute("/tests/subject/:subjectId");
  const subjectId = Number(params?.subjectId);
  const [, setLocation] = useLocation();

  // Subject info
  const [subjectName, setSubjectName] = useState("");
  const [subjectIcon, setSubjectIcon] = useState("📚");

  // Phase
  const [phase, setPhase] = useState<Phase>("setup");

  // Setup options
  const [questionCount, setQuestionCount] = useState(25);
  const [timeMins, setTimeMins] = useState(25);
  const [timeManual, setTimeManual] = useState(false);

  // Questions
  const [questions, setQuestions] = useState<ShuffledQ[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState("");

  // Exam state
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [hints, setHints] = useState<Set<number>>(new Set());
  const [timeLeft, setTimeLeft] = useState(0);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Result state
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [expandedQ, setExpandedQ] = useState<Set<number>>(new Set());

  // Sync default time with question count (1 min/question) unless manually overridden
  useEffect(() => {
    if (!timeManual) setTimeMins(questionCount);
  }, [questionCount, timeManual]);

  // Load subject name from API
  useEffect(() => {
    if (!subjectId) return;
    fetch(`/api/subjects`)
      .then((r) => r.json())
      .then((data: { id: number; nameBn: string; icon: string }[]) => {
        const s = data.find((x) => x.id === subjectId);
        if (s) { setSubjectName(s.nameBn); setSubjectIcon(s.icon); }
      })
      .catch(() => {});
  }, [subjectId]);

  const startExam = async () => {
    setLoading(true);
    setFetchError("");
    try {
      const res = await fetch(`/api/subjects/${subjectId}/questions?limit=${questionCount}`);
      if (!res.ok) throw new Error("API error");
      const data: QuestionRow[] = await res.json();
      if (data.length === 0) { setFetchError("এই বিষয়ে এখনো প্রশ্ন নেই। আগে প্রশ্ন যোগ করুন।"); setLoading(false); return; }
      const shuffled: ShuffledQ[] = shuffleArray(data).map((q) => ({
        ...q,
        displayOrder: shuffleArray(q.options.map((_, i) => i)),
      }));
      setQuestions(shuffled);
      setAnswers({});
      setFlagged(new Set());
      setHints(new Set());
      setTimeLeft(timeMins * 60);
      setPhase("exam");
    } catch {
      setFetchError("প্রশ্ন লোড করতে ব্যর্থ হয়েছে। পুনরায় চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  };

  // Timer
  useEffect(() => {
    if (phase !== "exam") return;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          finishExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const finishExam = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase("result");
    generateAI();
  };

  const generateAI = () => {
    const score = questions.filter((q) => answers[q.id] === q.correctIndex).length;
    const pct = Math.round((score / Math.max(questions.length, 1)) * 100);
    const wrongQs = questions.filter((q) => answers[q.id] !== q.correctIndex && answers[q.id] !== undefined);
    const prompt = `তুমি Qovo-র AI টিউটর। একজন SSC পরীক্ষার্থী "${subjectName}" বিষয়ের একটি মডেল টেস্ট দিয়েছে।\n\nফলাফল:\n- মোট: ${questions.length}, সঠিক: ${score}, ভুল: ${questions.length - score}, সঠিকতা: ${pct}%\n${wrongQs.slice(0, 5).map((q) => `• "${q.questionText.slice(0, 60)}"…`).join("\n")}\n\nবাংলায় ৪-৫ লাইনে emoji সহ বলো:\n১. পারফরম্যান্স মূল্যায়ন\n২. দুর্বল দিক\n৩. নির্দিষ্ট পরামর্শ\nসংক্ষিপ্ত ও কার্যকর রাখো।`;
    setAiLoading(true);
    fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: prompt }),
    })
      .then((r) => r.json())
      .then((d) => setAiAnalysis(d.reply ?? ""))
      .catch(() => setAiAnalysis("AI বিশ্লেষণ পাওয়া যায়নি।"))
      .finally(() => setAiLoading(false));
  };

  // ── PHASE: SETUP ──────────────────────────────────────────────────────────
  if (phase === "setup") {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-xl mx-auto mt-8">
        <Link href="/tests">
          <Button variant="ghost" size="sm" className="mb-4 text-muted-foreground">
            <ArrowLeft className="w-4 h-4 mr-1" /> টেস্ট তালিকা
          </Button>
        </Link>
        <Card className="overflow-hidden">
          <div className="h-1.5 qovo-gradient" />
          <CardContent className="p-7 space-y-6">
            <div>
              <h1 className="text-2xl font-bold">{subjectName || "মডেল টেস্ট"}</h1>
              <p className="text-muted-foreground text-sm mt-1">নিচের অপশনগুলো কাস্টমাইজ করে টেস্ট শুরু করুন</p>
            </div>

            {/* Question Count */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-foreground">প্রশ্নসংখ্যা</label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setQuestionCount((c) => Math.max(5, c - 5))}
                  className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <div className="flex-1 text-center">
                  <span className="text-3xl font-bold qovo-gradient-text">{questionCount}</span>
                  <span className="text-muted-foreground text-sm ml-1">প্রশ্ন</span>
                </div>
                <button
                  type="button"
                  onClick={() => setQuestionCount((c) => Math.min(100, c + 5))}
                  className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="flex gap-2">
                {[10, 20, 25, 30, 50].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setQuestionCount(n)}
                    className={cn(
                      "flex-1 text-xs py-1.5 rounded-lg border transition-all",
                      questionCount === n ? "qovo-gradient text-white border-0" : "border-border hover:border-primary/40",
                    )}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Time */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-foreground">
                সময় (মিনিট)
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  {!timeManual ? "— স্বয়ংক্রিয় (১ প্রশ্ন = ১ মিনিট)" : "— কাস্টম"}
                </span>
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => { setTimeManual(true); setTimeMins((t) => Math.max(5, t - 5)); }}
                  className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <div className="flex-1 text-center">
                  <span className="text-3xl font-bold qovo-gradient-text">{timeMins}</span>
                  <span className="text-muted-foreground text-sm ml-1">মিনিট</span>
                </div>
                <button
                  type="button"
                  onClick={() => { setTimeManual(true); setTimeMins((t) => Math.min(180, t + 5)); }}
                  className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {timeManual && (
                <button
                  type="button"
                  onClick={() => { setTimeManual(false); setTimeMins(questionCount); }}
                  className="text-xs text-primary hover:underline"
                >
                  স্বয়ংক্রিয়তে ফিরে যাও
                </button>
              )}
            </div>

            {/* Info box */}
            <div className="grid grid-cols-3 gap-3 text-center py-3 border-y border-border">
              {[
                { label: "প্রশ্ন", value: questionCount },
                { label: "সময়", value: `${timeMins}মি` },
                { label: "প্রতি প্রশ্ন", value: `${Math.round((timeMins * 60) / questionCount)}সে` },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xl font-bold qovo-gradient-text">{value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            <div className="text-xs text-muted-foreground space-y-1">
              <p>✅ প্রশ্ন ও অপশন প্রতিবার এলোমেলো হবে</p>
              <p>🚩 কঠিন প্রশ্ন ফ্ল্যাগ করে রাখতে পারবে</p>
              <p>⏱️ সময় শেষে স্বয়ংক্রিয়ভাবে জমা হবে</p>
              <p>🤖 শেষে AI পারফরম্যান্স বিশ্লেষণ পাবে</p>
            </div>

            {fetchError && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm">
                {fetchError}
              </div>
            )}

            <Button
              size="lg"
              className="w-full h-14 rounded-xl qovo-gradient text-white border-0 qovo-glow text-base"
              onClick={startExam}
              disabled={loading}
            >
              {loading ? "প্রশ্ন লোড হচ্ছে..." : "পরীক্ষা শুরু করুন →"}
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // ── PHASE: EXAM ───────────────────────────────────────────────────────────
  if (phase === "exam") {
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    const answered = Object.keys(answers).length;
    const total = questions.length;
    const isLow = timeLeft < 60;
    const isWarn = timeLeft < 300;

    return (
      <div className="max-w-3xl mx-auto pb-32">
        {/* Sticky timer */}
        <div className="sticky top-0 z-20 bg-background/90 backdrop-blur border-b border-border py-3 mb-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="text-sm font-medium text-muted-foreground">{answered}/{total} উত্তর</div>
              {flagged.size > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/40 text-orange-600">
                  🚩 {flagged.size}
                </span>
              )}
            </div>
            <div className={cn(
              "flex items-center gap-1.5 font-mono text-xl font-bold px-4 py-1.5 rounded-2xl transition-all",
              isLow ? "bg-destructive/10 text-destructive animate-pulse" :
              isWarn ? "bg-orange-100 dark:bg-orange-950/40 text-orange-600" : "bg-primary/10 text-primary",
            )}>
              <Clock className="w-5 h-5" />
              {mins.toString().padStart(2, "0")}:{secs.toString().padStart(2, "0")}
            </div>
            <Button size="sm" onClick={() => setShowSubmitModal(true)} className="qovo-gradient text-white border-0 rounded-xl">
              জমা দিন
            </Button>
          </div>
          <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
            <motion.div className="h-full qovo-gradient" animate={{ width: `${(answered / total) * 100}%` }} transition={{ duration: 0.4 }} />
          </div>
        </div>

        <div className="space-y-5">
          {questions.map((q, idx) => {
            const isFlagged = flagged.has(q.id);
            const isAnswered = answers[q.id] !== undefined;
            const hintShown = hints.has(q.id);
            return (
              <motion.div key={q.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(idx * 0.03, 0.5) }}>
                <Card className={cn("border-2 transition-all", isFlagged ? "border-orange-400" : isAnswered ? "border-primary/30" : "border-border")}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="flex-shrink-0 w-7 h-7 rounded-full qovo-gradient text-white text-xs font-bold flex items-center justify-center">{idx + 1}</span>
                        <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium",
                          q.difficulty === "easy" ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300" :
                          q.difficulty === "medium" ? "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300" :
                          "bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300",
                        )}>
                          {q.difficulty === "easy" ? "সহজ" : q.difficulty === "medium" ? "মাঝারি" : "কঠিন"}
                        </span>
                      </div>
                      <div className="flex gap-1.5">
                        <button type="button"
                          onClick={() => setHints((p) => { const n = new Set(p); n.add(q.id); return n; })}
                          disabled={hintShown}
                          className={cn("text-xs px-2 py-1 rounded-full flex items-center gap-1 transition-all",
                            hintShown ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300" :
                            "bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300"
                          )}>
                          <Lightbulb className={cn("w-3 h-3", hintShown && "fill-current")} />সংকেত
                        </button>
                        <button type="button"
                          onClick={() => setFlagged((p) => { const n = new Set(p); if (n.has(q.id)) n.delete(q.id); else n.add(q.id); return n; })}
                          className={cn("text-xs px-2 py-1 rounded-full flex items-center gap-1 transition-all",
                            isFlagged ? "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300" :
                            "bg-muted hover:bg-orange-50 text-muted-foreground hover:text-orange-600"
                          )}>
                          <Flag className={cn("w-3 h-3", isFlagged && "fill-current")} />{isFlagged ? "ফ্ল্যাগড" : "ফ্ল্যাগ"}
                        </button>
                      </div>
                    </div>

                    <h3 className="font-bold text-base leading-relaxed mb-3">{q.questionText}</h3>

                    <AnimatePresence>
                      {hintShown && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-3">
                          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-100 text-sm">
                            💡 {q.hint && q.hint.trim() ? q.hint : "মূল ধারণা ও সংজ্ঞা মনে করার চেষ্টা করো।"}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="grid gap-2">
                      {q.displayOrder.map((origIdx, dispIdx) => {
                        const isSelected = answers[q.id] === origIdx;
                        return (
                          <motion.button key={dispIdx} whileHover={{ scale: 1.005 }} whileTap={{ scale: 0.995 }}
                            onClick={() => { playHush(); setAnswers((p) => ({ ...p, [q.id]: origIdx })); }}
                            className={cn("flex items-center p-3 rounded-xl border-2 text-left transition-all w-full text-sm",
                              isSelected ? "border-primary bg-primary/5 text-primary" :
                              "border-border hover:border-primary/40 hover:bg-muted/40",
                            )}>
                            <div className={cn("w-6 h-6 rounded-full border-2 flex items-center justify-center mr-3 text-xs font-semibold flex-shrink-0",
                              isSelected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/30 text-muted-foreground",
                            )}>
                              {String.fromCharCode(65 + dispIdx)}
                            </div>
                            <span className="font-medium flex-1">{q.options[origIdx]}</span>
                            {isSelected && <CheckCircle2 className="w-4 h-4 ml-2 text-primary flex-shrink-0" />}
                          </motion.button>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t border-border py-3 px-4 z-20">
          <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              {total - answered > 0 ? <span className="text-orange-500 font-medium">⚠️ {total - answered}টি বাকি</span>
                : <span className="text-emerald-500 font-medium">✅ সব উত্তর দেওয়া হয়েছে</span>}
            </p>
            <Button size="lg" onClick={() => setShowSubmitModal(true)} className="qovo-gradient text-white border-0 rounded-xl px-8">
              জমা দিন →
            </Button>
          </div>
        </div>

        {/* Submit modal */}
        <AnimatePresence>
          {showSubmitModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
              onClick={() => setShowSubmitModal(false)}>
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-card border border-border rounded-2xl p-7 max-w-sm w-full text-center space-y-4 shadow-2xl">
                <div className="w-14 h-14 mx-auto rounded-full qovo-gradient flex items-center justify-center">
                  <AlertCircle className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold">টেস্ট জমা দিবেন?</h3>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>উত্তর দেওয়া: <strong className="text-foreground">{answered}/{total}</strong></p>
                  {flagged.size > 0 && <p>ফ্ল্যাগড: <strong className="text-orange-500">{flagged.size}টি</strong></p>}
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => setShowSubmitModal(false)}>আরও দেখি</Button>
                  <Button className="flex-1 qovo-gradient text-white border-0" onClick={() => { setShowSubmitModal(false); finishExam(); }}>হ্যাঁ, জমা দিন</Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ── PHASE: RESULT ─────────────────────────────────────────────────────────
  const score = questions.filter((q) => answers[q.id] === q.correctIndex).length;
  const pct = Math.round((score / Math.max(questions.length, 1)) * 100);
  const grade = pct >= 80 ? { label: "অসাধারণ! 🏆", color: "text-emerald-500" }
    : pct >= 60 ? { label: "ভালো! 👍", color: "text-primary" }
    : pct >= 40 ? { label: "মোটামুটি 📚", color: "text-orange-500" }
    : { label: "আরও পড়তে হবে 💪", color: "text-destructive" };
  const timeTaken = timeMins * 60 - timeLeft;

  return (
    <div className="max-w-3xl mx-auto space-y-7 pb-12">
      {/* Score card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="overflow-hidden">
          <div className="h-1.5 qovo-gradient" />
          <CardContent className="p-7 text-center space-y-4">
            <div className="w-18 h-18 mx-auto w-16 h-16 qovo-gradient rounded-full flex items-center justify-center qovo-glow">
              <Trophy className="w-9 h-9 text-white" />
            </div>
            <h1 className="text-2xl font-bold">পরীক্ষা সম্পন্ন!</h1>
            <p className="text-muted-foreground">{subjectName}</p>

            <div className="flex items-center justify-center gap-8 py-3">
              <PercentRing pct={pct} />
              <div className="text-left space-y-2">
                <p className={cn("text-xl font-bold", grade.color)}>{grade.label}</p>
                <p className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm">
                  <CheckCircle2 className="w-4 h-4" /> {score} সঠিক
                </p>
                <p className="flex items-center gap-2 text-destructive text-sm">
                  <XCircle className="w-4 h-4" /> {questions.length - score} ভুল
                </p>
                <p className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Clock className="w-4 h-4" /> {Math.floor(timeTaken / 60)}:{(timeTaken % 60).toString().padStart(2, "0")}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { l: "স্কোর", v: `${score}/${questions.length}`, c: "bg-primary/10 text-primary" },
                { l: "সঠিকতা", v: `${pct}%`, c: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600" },
                { l: "উত্তর দেওয়া", v: `${Object.keys(answers).length}/${questions.length}`, c: "bg-muted text-muted-foreground" },
              ].map(({ l, v, c }) => (
                <div key={l} className={cn("rounded-xl p-3 text-center", c)}>
                  <p className="font-bold text-base">{v}</p>
                  <p className="text-xs opacity-80">{l}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* AI Analysis */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
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
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-4 w-3/5" />
              </div>
            ) : (
              <div className="text-sm text-muted-foreground leading-relaxed">
                {(aiAnalysis || "বিশ্লেষণ পাওয়া যায়নি।").split("\n").map((l, i) => <p key={i}>{l}</p>)}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Per-question review */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <h2 className="text-lg font-bold mb-3">প্রশ্নভিত্তিক ফলাফল</h2>
        <div className="space-y-2.5">
          {questions.map((q, idx) => {
            const picked = answers[q.id];
            const notAnswered = picked === undefined;
            const isCorrect = picked === q.correctIndex;
            const isOpen = expandedQ.has(q.id);
            return (
              <Card key={q.id}
                className={cn("border overflow-hidden cursor-pointer", !notAnswered && "border-l-4",
                  !notAnswered && isCorrect && "border-l-emerald-500",
                  !notAnswered && !isCorrect && "border-l-destructive",
                  notAnswered && "border-muted",
                )}
                onClick={() => setExpandedQ((p) => { const n = new Set(p); if (n.has(q.id)) n.delete(q.id); else n.add(q.id); return n; })}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={cn("flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mt-0.5",
                      notAnswered ? "bg-muted text-muted-foreground" : isCorrect ? "bg-emerald-500 text-white" : "bg-destructive text-white")}>
                      {notAnswered ? "—" : isCorrect ? "✓" : "✗"}
                    </div>
                    <p className="flex-1 text-sm font-medium leading-snug">{idx + 1}. {q.questionText}</p>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" /> : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />}
                  </div>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                        <div className="mt-3 pl-10 space-y-2">
                          {notAnswered ? (
                            <p className="text-xs text-muted-foreground italic">উত্তর দেওয়া হয়নি।</p>
                          ) : (
                            <>
                              {!isCorrect && (
                                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 text-sm">
                                  <XCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                                  <div><p className="text-xs text-destructive font-semibold mb-0.5">তুমি বেছেছিলে:</p><p>{q.options[picked!]}</p></div>
                                </div>
                              )}
                              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 text-sm">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                                <div><p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mb-0.5">সঠিক উত্তর:</p><p className="font-medium">{q.options[q.correctIndex]}</p></div>
                              </div>
                            </>
                          )}
                          <div className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/60 border border-border text-sm">
                            <p className="text-muted-foreground text-xs leading-relaxed">📖 {q.explanation}</p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </motion.div>

      {/* Actions */}
      <div className="flex gap-3 justify-center pt-2">
        <Button variant="outline" size="lg" onClick={() => { setPhase("setup"); setQuestions([]); }}>আবার দিন</Button>
        <Link href="/tests"><Button size="lg" className="qovo-gradient text-white border-0">সব টেস্ট →</Button></Link>
      </div>
    </div>
  );
}
