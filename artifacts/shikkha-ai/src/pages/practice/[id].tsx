import { useState, useMemo, useEffect, useRef } from "react";
import { useListQuestionsByChapter, useSubmitPracticeAnswer } from "@workspace/api-client-react";
import { useRoute, Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2,
  XCircle,
  ArrowRight,
  ChevronLeft,
  Trophy,
  Lightbulb,
  Sparkles,
  Shuffle,
  BookmarkCheck,
  RotateCcw,
  Calendar,
  BookOpen,
  Zap,
  Trash2,
  Flag,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { playHush, playCorrect, playWrong } from "@/hooks/useSound";
import { useWrongAnswers } from "@/hooks/useWrongAnswers";
import { MathText } from "@/components/MathText";

type QuestionLike = {
  id: number;
  questionText: string;
  options: string[];
  correctIndex: number;
  difficulty: string;
  hint?: string | null;
  explanation: string;
  source?: string | null;
  year?: number | null;
};

interface ShuffledQuestion {
  base: QuestionLike;
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

function buildShuffled(questions: QuestionLike[]): ShuffledQuestion[] {
  return shuffleArray(questions).map((q) => ({
    base: q,
    displayOrder: shuffleArray(q.options.map((_, i) => i)),
  }));
}

/** Detect question category from text heuristically */
function detectCategory(text: string): { label: string; color: string } {
  const t = text;
  if (/কোনটি|কী|কে|কত|কোন/.test(t) && t.length < 80)
    return { label: "জ্ঞানমূলক", color: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300" };
  if (/ব্যাখ্যা|কারণ|কেন|কীভাবে/.test(t))
    return { label: "অনুধাবনমূলক", color: "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300" };
  if (/হলে|যদি|গণনা|নির্ণয়|বের/.test(t))
    return { label: "প্রয়োগমূলক", color: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300" };
  return { label: "উচ্চতর দক্ষতা", color: "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300" };
}

export default function Practice() {
  const [, params] = useRoute("/practice/:chapterId");
  const chapterId = Number(params?.chapterId);

  const { data: questions, isLoading } = useListQuestionsByChapter(chapterId, {
    query: { enabled: !!chapterId, queryKey: ["/api/chapters", chapterId, "questions"] },
  });

  const submitAnswer = useSubmitPracticeAnswer();
  const { addWrong, wrongAnswers } = useWrongAnswers();

  const [shuffleSeed, setShuffleSeed] = useState(0);
  const shuffled = useMemo<ShuffledQuestion[]>(() => {
    if (!questions || questions.length === 0) return [];
    return buildShuffled(questions as QuestionLike[]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions, shuffleSeed]);

  const adminMode = useMemo(() => { try { return !!sessionStorage.getItem("qovo-admin-token"); } catch { return false; } }, []);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [reportOpen,    setReportOpen]    = useState(false);
  const [reportReason,  setReportReason]  = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [reportBusy,    setReportBusy]    = useState(false);
  const [reportDone,    setReportDone]    = useState(false);

  const REPORT_REASONS = ["ভুল উত্তর", "ভুল LaTeX/সূত্র", "বানান ভুল", "অপূর্ণ প্রশ্ন", "ডুপ্লিকেট", "ভুল ব্যাখ্যা", "অন্যান্য"];

  const handleReport = async () => {
    if (!reportReason || !current) return;
    setReportBusy(true);
    await fetch(`/api/questions/${current.base.id}/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: reportReason, details: reportDetails || null }),
    }).catch(() => {});
    setReportBusy(false);
    setReportOpen(false);
    setReportDone(true);
    setReportReason(""); setReportDetails("");
    setTimeout(() => setReportDone(false), 4000);
  };

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedDisplayIdx, setSelectedDisplayIdx] = useState<number | null>(null);
  const [answerResult, setAnswerResult] = useState<{
    correct: boolean;
    correctIndex: number;
    explanation: string;
    pointsEarned: number;
  } | null>(null);
  const [hintRevealed, setHintRevealed] = useState(false);
  const [sessionWrong, setSessionWrong] = useState(0);
  const [sessionCorrect, setSessionCorrect] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHintRevealed(false);
    // Scroll back to top of question on change
    cardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [currentIndex]);

  const handleDelete = async (id: number) => {
    try {
      const token = (() => { try { return sessionStorage.getItem("qovo-admin-token") ?? ""; } catch { return ""; } })();
      await fetch(`/api/questions/${id}`, { method: "DELETE", headers: { "x-admin-token": token } });
      setDeleteConfirmId(null);
      window.location.reload();
    } catch { setDeleteConfirmId(null); }
  };

  const current = shuffled[currentIndex];
  const isLastQuestion = shuffled.length > 0 && currentIndex === shuffled.length - 1;
  const isCompleted = shuffled.length > 0 && currentIndex >= shuffled.length;

  const handleSelectOption = (displayIdx: number) => {
    if (selectedDisplayIdx !== null || !current) return;
    playHush();
    const originalIdx = current.displayOrder[displayIdx];
    setSelectedDisplayIdx(displayIdx);
    submitAnswer.mutate(
      { data: { questionId: current.base.id, selectedIndex: originalIdx } },
      {
        onSuccess: (result) => {
          setAnswerResult(result);
          if (result.correct) {
            playCorrect();
            setSessionCorrect((c) => c + 1);
          } else {
            playWrong();
            setSessionWrong((w) => w + 1);
            addWrong({
              questionId: current.base.id,
              questionText: current.base.questionText,
              correctOption: current.base.options[result.correctIndex],
              selectedOption: current.base.options[originalIdx],
              explanation: result.explanation,
              chapterId,
              savedAt: new Date().toISOString(),
            });
          }
        },
      },
    );
  };

  const handleNext = () => {
    setSelectedDisplayIdx(null);
    setAnswerResult(null);
    setCurrentIndex((p) => p + 1);
  };

  const restart = () => {
    setShuffleSeed((s) => s + 1);
    setCurrentIndex(0);
    setSelectedDisplayIdx(null);
    setAnswerResult(null);
    setHintRevealed(false);
    setSessionCorrect(0);
    setSessionWrong(0);
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 pb-32">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!questions || questions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <h2 className="text-2xl font-bold mb-4">কোনো প্রশ্ন পাওয়া যায়নি</h2>
        <Link href="/subjects"><Button>ফিরে যান</Button></Link>
      </div>
    );
  }

  if (isCompleted || !current) {
    const total = sessionCorrect + sessionWrong;
    const pct = total > 0 ? Math.round((sessionCorrect / total) * 100) : 0;
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md mx-auto text-center py-12 space-y-6"
      >
        <div className="w-24 h-24 mx-auto qovo-gradient text-white rounded-full flex items-center justify-center qovo-glow">
          <Trophy className="w-12 h-12" />
        </div>
        <h2 className="text-3xl font-bold">অনুশীলন সম্পন্ন!</h2>
        <div className="grid grid-cols-3 gap-4 py-4">
          <div className="bg-muted/50 rounded-2xl p-4">
            <p className="text-3xl font-bold qovo-gradient-text">{pct}%</p>
            <p className="text-xs text-muted-foreground mt-1">সঠিকতা</p>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl p-4">
            <p className="text-3xl font-bold text-emerald-600">{sessionCorrect}</p>
            <p className="text-xs text-muted-foreground mt-1">সঠিক</p>
          </div>
          <div className="bg-red-50 dark:bg-red-950/30 rounded-2xl p-4">
            <p className="text-3xl font-bold text-destructive">{sessionWrong}</p>
            <p className="text-xs text-muted-foreground mt-1">ভুল</p>
          </div>
        </div>
        {sessionWrong > 0 && (
          <div className="flex items-center gap-2 justify-center text-sm text-muted-foreground bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-xl p-3">
            <BookmarkCheck className="w-4 h-4 text-amber-600" />
            <span>{sessionWrong}টি ভুল উত্তর রিভিউ লিস্টে সেভ হয়েছে</span>
          </div>
        )}
        <div className="flex gap-3 justify-center pt-2">
          <Link href="/subjects">
            <Button variant="outline">অন্য বিষয়</Button>
          </Link>
          <Button onClick={restart} className="qovo-gradient text-white border-0">
            <Shuffle className="w-4 h-4 mr-2" /> আবার এলোমেলো
          </Button>
        </div>
        {wrongAnswers.length > 0 && (
          <Link href="/review">
            <Button variant="ghost" size="sm" className="text-amber-600">
              <BookmarkCheck className="w-4 h-4 mr-1" />
              সব ভুল উত্তর দেখুন ({wrongAnswers.length})
            </Button>
          </Link>
        )}
      </motion.div>
    );
  }

  const hintText =
    current.base.hint && current.base.hint.trim().length > 0
      ? current.base.hint
      : current.base.explanation.length > 60
        ? current.base.explanation.slice(0, 60) + "…"
        : current.base.explanation;

  const category = detectCategory(current.base.questionText);
  const hasSource = current.base.source || current.base.year;

  return (
    <div className="max-w-3xl mx-auto pb-[150px] md:pb-28">
      {/* ── Top control bar ── */}
      <div ref={cardRef} className="flex items-center justify-between mb-3">
        <Link href="/subjects">
          <Button variant="ghost" size="sm" className="text-muted-foreground -ml-2">
            <ChevronLeft className="w-4 h-4 mr-1" /> ফিরে যান
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          {sessionWrong > 0 && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-red-50 dark:bg-red-950/30 text-destructive border border-red-200 dark:border-red-900">
              {sessionWrong} ভুল সেভ
            </span>
          )}
          <button
            type="button"
            onClick={restart}
            className="text-xs px-3 py-1.5 rounded-full bg-muted hover:bg-muted/70 text-muted-foreground flex items-center gap-1.5 transition-colors"
          >
            <Shuffle className="w-3.5 h-3.5" /> শাফল
          </button>
          <div className="text-sm font-semibold text-muted-foreground tabular-nums">
            {currentIndex + 1}<span className="opacity-50">/{shuffled.length}</span>
          </div>
        </div>
      </div>

      <Progress value={(currentIndex / shuffled.length) * 100} className="h-1.5 mb-4" />

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex + "-" + shuffleSeed}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="space-y-3"
        >
          {/* ── Question card ── */}
          <Card className="border-border shadow-md overflow-hidden">
            {/* Top source strip */}
            {hasSource && (
              <div className="px-5 pt-4 pb-2 flex items-center gap-2 flex-wrap">
                {current.base.source && (
                  <span className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
                    <BookOpen className="w-3 h-3" />
                    {current.base.source}
                  </span>
                )}
                {current.base.year && (
                  <span className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    {current.base.year}
                  </span>
                )}
              </div>
            )}

            <CardContent className={cn("p-5 md:p-6", hasSource && "pt-2")}>
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={cn(
                      "text-xs font-semibold px-2.5 py-1 rounded-full",
                      current.base.difficulty === "easy"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                        : current.base.difficulty === "medium"
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                          : "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300",
                    )}
                  >
                    {current.base.difficulty === "easy" ? "সহজ" : current.base.difficulty === "medium" ? "মাঝারি" : "কঠিন"}
                  </span>
                  <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full", category.color)}>
                  
                    {category.label}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setHintRevealed(true)}
                  disabled={hintRevealed || selectedDisplayIdx !== null}
                  className={cn(
                    "flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-all",
                    hintRevealed
                      ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                      : "bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:hover:bg-amber-950/60 dark:text-amber-300",
                    selectedDisplayIdx !== null && "opacity-40 cursor-not-allowed",
                  )}
                >
                  <Lightbulb className={cn("w-3.5 h-3.5", hintRevealed && "fill-current")} />
                  {hintRevealed ? "সংকেত দেখানো হয়েছে" : "সংকেত (Hint)"}
                </button>
                {adminMode && !reportDone && (
                  <button type="button" onClick={() => { setReportOpen((p) => !p); setDeleteConfirmId(null); }}
                    className={cn("flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-full transition-all",
                      reportOpen ? "bg-orange-200 text-orange-700" : "bg-orange-50 hover:bg-orange-100 text-orange-600")}>
                    <Flag className="w-3 h-3" /> রিপোর্ট
                  </button>
                )}
                {adminMode && reportDone && (
                  <span className="text-xs text-muted-foreground px-2 py-1">রিপোর্ট হয়েছে</span>
                )}
                {adminMode && deleteConfirmId !== current.base.id && (
                  <button type="button" onClick={() => { setDeleteConfirmId(current.base.id); setReportOpen(false); }}
                    className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20 transition-all">
                    <Trash2 className="w-3 h-3" /> ট্র্যাশ
                  </button>
                )}
                {adminMode && deleteConfirmId === current.base.id && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-destructive font-medium">ট্র্যাশে?</span>
                    <button type="button" onClick={() => handleDelete(current.base.id)}
                      className="text-xs px-2.5 py-1 rounded-lg bg-destructive text-white font-semibold">হ্যাঁ</button>
                    <button type="button" onClick={() => setDeleteConfirmId(null)}
                      className="text-xs px-2.5 py-1 rounded-lg bg-muted text-foreground">না</button>
                  </div>
                )}
              </div>

              {/* Report dialog */}
              <AnimatePresence>
                {adminMode && reportOpen && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                    <div className="mt-2 p-3 rounded-xl border border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-900 space-y-2">
                      <p className="text-xs font-semibold text-orange-700 dark:text-orange-300">সমস্যার কারণ বেছে নিন:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {REPORT_REASONS.map((r) => (
                          <button key={r} type="button" onClick={() => setReportReason(r)}
                            className={cn("text-xs px-2 py-1 rounded-lg border transition-colors",
                              reportReason === r ? "bg-orange-500 text-white border-orange-500" : "border-border text-muted-foreground hover:border-orange-400")}>
                            {r}
                          </button>
                        ))}
                      </div>
                      <input value={reportDetails} onChange={(e) => setReportDetails(e.target.value)}
                        placeholder="বিস্তারিত (ঐচ্ছিক)"
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none" />
                      <div className="flex gap-2">
                        <button type="button" onClick={handleReport} disabled={!reportReason || reportBusy}
                          className="text-xs px-3 py-1.5 rounded-lg bg-orange-500 text-white font-semibold disabled:opacity-50 flex items-center gap-1">
                          {reportBusy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Flag className="w-3 h-3" />} জমা
                        </button>
                        <button type="button" onClick={() => setReportOpen(false)}
                          className="text-xs px-3 py-1.5 rounded-lg bg-muted text-foreground">বাতিল</button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <h2 className="text-xl md:text-2xl font-bold text-foreground leading-relaxed">
                <MathText>{current.base.questionText}</MathText>
              </h2>

              <AnimatePresence>
                {hintRevealed && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: "auto", marginTop: 16 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-100">
                      <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
                      <p className="text-sm leading-relaxed"><MathText>{hintText}</MathText></p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>

          {/* ── Options ── */}
          <div className="grid gap-2.5">
            {current.displayOrder.map((originalIdx, displayIdx) => {
              const option = current.base.options[originalIdx];
              const isSelected = selectedDisplayIdx === displayIdx;
              const isSubmitted = selectedDisplayIdx !== null;
              const isCorrect = answerResult?.correctIndex === originalIdx;
              const isWrongSelected = isSelected && !isCorrect;

              return (
                <motion.button
                  key={displayIdx}
                  whileHover={!isSubmitted ? { scale: 1.01 } : {}}
                  whileTap={!isSubmitted ? { scale: 0.99 } : {}}
                  onClick={() => handleSelectOption(displayIdx)}
                  disabled={isSubmitted || submitAnswer.isPending}
                  className={cn(
                    "relative flex items-center p-4 rounded-xl border-2 text-left transition-all duration-200",
                    !isSubmitted && "border-border hover:border-primary/50 hover:bg-muted/50 bg-card cursor-pointer",
                    isSubmitted && isCorrect && "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-100",
                    isSubmitted && isWrongSelected && "border-destructive bg-destructive/10 text-destructive",
                    isSubmitted && !isCorrect && !isWrongSelected && "border-border bg-muted/40 opacity-50 cursor-not-allowed",
                  )}
                >
                  <div className={cn(
                    "flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center mr-4 font-bold text-sm transition-all",
                    !isSubmitted && "border-border text-muted-foreground",
                    isSubmitted && isCorrect && "border-emerald-500 bg-emerald-500 text-white",
                    isSubmitted && isWrongSelected && "border-destructive bg-destructive text-white",
                    isSubmitted && !isCorrect && !isWrongSelected && "border-border text-muted-foreground",
                  )}>
                    {String.fromCharCode(65 + displayIdx)}
                  </div>
                  <span className="flex-1 font-medium text-[15px] leading-snug"><MathText>{option}</MathText></span>
                  {isSubmitted && isCorrect && <CheckCircle2 className="w-6 h-6 text-emerald-500 absolute right-4" />}
                  {isSubmitted && isWrongSelected && <XCircle className="w-6 h-6 text-destructive absolute right-4" />}
                </motion.button>
              );
            })}
          </div>

          {/* ── Explanation (inline, no button here) ── */}
          <AnimatePresence>
            {answerResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22 }}
              >
                <div className={cn(
                  "rounded-2xl border-l-4 p-5",
                  answerResult.correct
                    ? "border-l-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50"
                    : "border-l-orange-500 bg-orange-50/80 dark:bg-orange-950/10 border border-orange-200 dark:border-orange-900/50",
                )}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0",
                      answerResult.correct ? "bg-emerald-500 text-white" : "bg-orange-500 text-white",
                    )}>
                      {answerResult.correct ? <CheckCircle2 className="w-4 h-4" /> : <RotateCcw className="w-4 h-4" />}
                    </div>
                    <span className="font-bold text-base">
                      {answerResult.correct
                        ? `সঠিক! +${answerResult.pointsEarned} পয়েন্ট`
                        : "ভুল হয়েছে — সঠিক উত্তর:"}
                    </span>
                  </div>

                  {!answerResult.correct && (
                    <div className="mb-3 p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-xl text-emerald-800 dark:text-emerald-200 font-medium flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <MathText>{current.base.options[answerResult.correctIndex]}</MathText>
                    </div>
                  )}

                  {/* Explanation text */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      <BookOpen className="w-3.5 h-3.5" /> ব্যাখ্যা
                    </div>
                    <p className="text-base leading-[1.85] text-foreground">
                      <MathText>{answerResult.explanation}</MathText>
                    </p>
                  </div>

                  {!answerResult.correct && (
                    <div className="mt-3 flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400">
                      <BookmarkCheck className="w-3.5 h-3.5" />
                      এই প্রশ্নটি রিভিউ লিস্টে সেভ হয়েছে
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>

      {/* ── STICKY BOTTOM ACTION BAR ── */}
      <div
        className="fixed bottom-16 md:bottom-0 left-0 right-0 z-[60] border-t border-border/60"
        style={{
          background: "hsl(var(--background) / 0.97)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
        }}
      >
        <div className="max-w-3xl mx-auto px-4 py-3">
          {answerResult ? (
            /* After answering — show prominent Next button */
            <div className="flex items-center gap-3">
              <div className={cn(
                "flex items-center gap-2 text-sm font-semibold flex-1",
                answerResult.correct ? "text-emerald-600" : "text-orange-600",
              )}>
                {answerResult.correct
                  ? <><CheckCircle2 className="w-4 h-4" /> সঠিক! +{answerResult.pointsEarned} পয়েন্ট</>
                  : <><XCircle className="w-4 h-4" /> ভুল হয়েছে</>
                }
              </div>
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-2 py-3 px-6 rounded-2xl text-white font-bold text-base shadow-lg qovo-glow transition-transform active:scale-95"
                style={{ background: "var(--qovo-gradient)", minWidth: 180 }}
              >
                <Zap className="w-4 h-4" />
                {isLastQuestion ? "সেশন শেষ করুন" : "পরবর্তী প্রশ্ন"}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            /* Before answering — show progress info */
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{currentIndex + 1}</span>/{shuffled.length} প্রশ্ন
                {sessionCorrect > 0 && (
                  <span className="ml-3 text-emerald-600 font-medium">{sessionCorrect} সঠিক</span>
                )}
              </div>
              <div className="text-xs text-muted-foreground px-3 py-1.5 bg-muted rounded-full">
                উত্তর বেছে নাও
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
