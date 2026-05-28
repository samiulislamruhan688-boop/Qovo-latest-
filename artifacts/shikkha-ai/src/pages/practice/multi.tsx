import { useState, useMemo, useEffect } from "react";
import { useSubmitPracticeAnswer } from "@workspace/api-client-react";
import { useLocation, Link } from "wouter";
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
  Layers,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { playHush, playCorrect, playWrong } from "@/hooks/useSound";
import { useWrongAnswers } from "@/hooks/useWrongAnswers";

type QuestionLike = {
  id: number;
  questionText: string;
  options: string[];
  correctIndex: number;
  difficulty: string;
  hint?: string | null;
  explanation: string;
  chapterId?: number;
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

// Parse ?chapters=1,2,3 from current location
function useChapterIds(): number[] {
  const [location] = useLocation();
  const search = typeof window !== "undefined" ? window.location.search : "";
  const raw = new URLSearchParams(search).get("chapters") ?? "";
  return raw
    .split(",")
    .map(Number)
    .filter((n) => !isNaN(n) && n > 0);
}

export default function MultiChapterPractice() {
  const chapterIds = useChapterIds();
  const [allQuestions, setAllQuestions] = useState<QuestionLike[]>([]);
  const [loadingState, setLoadingState] = useState<"loading" | "done" | "error">("loading");
  const [shuffleSeed, setShuffleSeed] = useState(0);

  const submitAnswer = useSubmitPracticeAnswer();
  const { addWrong, wrongAnswers } = useWrongAnswers();

  // Fetch questions from all chapter IDs
  useEffect(() => {
    if (chapterIds.length === 0) {
      setLoadingState("done");
      return;
    }
    setLoadingState("loading");
    const base = import.meta.env.BASE_URL.replace(/\/$/, "");
    Promise.all(
      chapterIds.map((id) =>
        fetch(`${base}/api/chapters/${id}/questions`)
          .then((r) => {
            if (!r.ok) throw new Error(`chapter ${id} failed`);
            return r.json() as Promise<QuestionLike[]>;
          })
          .then((qs) => qs.map((q) => ({ ...q, chapterId: id }))),
      ),
    )
      .then((results) => {
        setAllQuestions(results.flat());
        setLoadingState("done");
      })
      .catch(() => setLoadingState("error"));
  }, [chapterIds.join(","), shuffleSeed]); // eslint-disable-line

  const shuffled = useMemo<ShuffledQuestion[]>(() => {
    if (!allQuestions.length) return [];
    return buildShuffled(allQuestions);
  }, [allQuestions, shuffleSeed]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedDisplayIdx, setSelectedDisplayIdx] = useState<number | null>(null);
  const [answerResult, setAnswerResult] = useState<{
    correct: boolean; correctIndex: number; explanation: string; pointsEarned: number;
  } | null>(null);
  const [hintRevealed, setHintRevealed] = useState(false);
  const [sessionWrong, setSessionWrong] = useState(0);
  const [sessionCorrect, setSessionCorrect] = useState(0);

  const current = shuffled[currentIndex];
  const isLastQuestion = shuffled.length > 0 && currentIndex === shuffled.length - 1;
  const isCompleted = shuffled.length > 0 && currentIndex >= shuffled.length;

  function handleSelectOption(displayIdx: number) {
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
              chapterId: current.base.chapterId ?? 0,
              savedAt: new Date().toISOString(),
            });
          }
        },
      },
    );
  }

  function handleNext() {
    setSelectedDisplayIdx(null);
    setAnswerResult(null);
    setHintRevealed(false);
    setCurrentIndex((p) => p + 1);
  }

  function restart() {
    setShuffleSeed((s) => s + 1);
    setCurrentIndex(0);
    setSelectedDisplayIdx(null);
    setAnswerResult(null);
    setHintRevealed(false);
    setSessionCorrect(0);
    setSessionWrong(0);
  }

  // Loading
  if (loadingState === "loading") {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
      </div>
    );
  }

  if (loadingState === "error") {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <h2 className="text-xl font-bold mb-4 text-destructive">প্রশ্ন লোড করা সম্ভব হয়নি</h2>
        <Link href="/subjects"><Button>ফিরে যান</Button></Link>
      </div>
    );
  }

  if (chapterIds.length === 0 || allQuestions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <h2 className="text-2xl font-bold mb-4">প্রশ্ন পাওয়া যায়নি</h2>
        <p className="text-muted-foreground mb-6">নির্বাচিত অধ্যায়গুলোতে প্রশ্ন নেই।</p>
        <Link href="/subjects"><Button>বিষয় পেজে ফিরুন</Button></Link>
      </div>
    );
  }

  // Completed
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
        <div>
          <h2 className="text-3xl font-bold mb-1">অনুশীলন সম্পন্ন!</h2>
          <p className="text-sm text-muted-foreground">{chapterIds.length}টি অধ্যায় · {allQuestions.length}টি প্রশ্ন</p>
        </div>
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
            <span>{sessionWrong}টি ভুল রিভিউ লিস্টে সেভ হয়েছে</span>
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

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <Link href="/subjects">
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            <ChevronLeft className="w-4 h-4 mr-1" /> ফিরে যান
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
            <Layers className="w-3.5 h-3.5" />
            {chapterIds.length}টি অধ্যায়
          </div>
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
          <div className="text-sm font-medium text-muted-foreground tabular-nums">
            {currentIndex + 1} / {shuffled.length}
          </div>
        </div>
      </div>

      <Progress value={(currentIndex / shuffled.length) * 100} className="h-1.5" />

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex + "-" + shuffleSeed}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="space-y-5"
        >
          <Card className="border-border shadow-md">
            <CardContent className="p-6 md:p-8">
              <div className="flex items-center justify-between mb-4">
                <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground">
                  {current.base.difficulty === "easy" ? "সহজ" : current.base.difficulty === "medium" ? "মাঝারি" : "কঠিন"}
                </div>
                <button
                  type="button"
                  onClick={() => setHintRevealed(true)}
                  disabled={hintRevealed || selectedDisplayIdx !== null}
                  className={cn(
                    "flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-all",
                    hintRevealed
                      ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                      : "bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300 hover:scale-105",
                    selectedDisplayIdx !== null && "opacity-40 cursor-not-allowed",
                  )}
                >
                  <Lightbulb className={cn("w-3.5 h-3.5", hintRevealed && "fill-current")} />
                  {hintRevealed ? "সংকেত দেখানো হয়েছে" : "সংকেত"}
                </button>
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-foreground leading-relaxed">
                {current.base.questionText}
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
                      <p className="text-sm leading-relaxed">{hintText}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>

          <div className="grid gap-3">
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
                    "flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center mr-4 font-semibold text-sm transition-all",
                    !isSubmitted && "border-border text-muted-foreground",
                    isSubmitted && isCorrect && "border-emerald-500 bg-emerald-500 text-white",
                    isSubmitted && isWrongSelected && "border-destructive bg-destructive text-white",
                    isSubmitted && !isCorrect && !isWrongSelected && "border-border text-muted-foreground",
                  )}>
                    {String.fromCharCode(65 + displayIdx)}
                  </div>
                  <span className="flex-1 font-medium">{option}</span>
                  {isSubmitted && isCorrect && <CheckCircle2 className="w-6 h-6 text-emerald-500 absolute right-4" />}
                  {isSubmitted && isWrongSelected && <XCircle className="w-6 h-6 text-destructive absolute right-4" />}
                </motion.button>
              );
            })}
          </div>

          <AnimatePresence>
            {answerResult && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22 }}
              >
                <Card className={cn("border-l-4", answerResult.correct ? "border-l-emerald-500" : "border-l-orange-500")}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className={cn("p-2 rounded-full", answerResult.correct ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40" : "bg-orange-100 text-orange-600 dark:bg-orange-900/40")}>
                        {answerResult.correct ? <CheckCircle2 className="w-6 h-6" /> : <RotateCcw className="w-6 h-6" />}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg mb-2">
                          {answerResult.correct ? `সঠিক! +${answerResult.pointsEarned} পয়েন্ট` : "ভুল — সঠিক উত্তর:"}
                        </h3>
                        {!answerResult.correct && (
                          <p className="font-medium text-foreground mb-3 p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded-lg text-emerald-800 dark:text-emerald-200">
                            {current.base.options[answerResult.correctIndex]}
                          </p>
                        )}
                        <p className="text-muted-foreground leading-relaxed text-sm">{answerResult.explanation}</p>
                        {!answerResult.correct && (
                          <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                            <BookmarkCheck className="w-3.5 h-3.5" /> রিভিউ লিস্টে সেভ হয়েছে
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="mt-6 flex justify-end">
                      <Button onClick={handleNext} size="lg" className="rounded-full px-8 qovo-gradient text-white border-0">
                        {isLastQuestion ? "সেশন শেষ করুন" : "পরবর্তী প্রশ্ন"}
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
