import { useState, useEffect, useMemo, useRef } from "react";
import { useGetTest, useSubmitTest } from "@workspace/api-client-react";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, Flag, Lightbulb, CheckCircle2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { playHush } from "@/hooks/useSound";

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

interface ShuffledQ {
  id: number;
  questionText: string;
  difficulty: string;
  hint?: string | null;
  options: string[];
  displayOrder: number[];
}

export default function TestTaking() {
  const [, params] = useRoute("/tests/:testId");
  const testId = Number(params?.testId);
  const [, setLocation] = useLocation();

  const { data: test, isLoading } = useGetTest(testId, {
    query: { enabled: !!testId, queryKey: ["/api/tests", testId] },
  });

  const submitMutation = useSubmitTest();

  const [started, setStarted] = useState(false);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [hintsUsed, setHintsUsed] = useState<Set<number>>(new Set());
  const [timeLeft, setTimeLeft] = useState(0);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const shuffled = useMemo<ShuffledQ[]>(() => {
    if (!test || !started) return [];
    return shuffleArray(test.questions).map((q) => ({
      id: q.id,
      questionText: q.questionText,
      difficulty: q.difficulty,
      hint: (q as { hint?: string | null }).hint ?? null,
      options: q.options,
      displayOrder: shuffleArray(q.options.map((_, i) => i)),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [test, started]);

  useEffect(() => {
    if (test && started) {
      const duration = test.questions.length * 60;
      setTimeLeft(duration);
    }
  }, [test, started]);

  useEffect(() => {
    if (!started || timeLeft <= 0) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          doSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started]);

  const handleSelect = (questionId: number, originalIdx: number) => {
    playHush();
    setAnswers((prev) => ({ ...prev, [questionId]: originalIdx }));
  };

  const toggleFlag = (questionId: number) => {
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) next.delete(questionId);
      else next.add(questionId);
      return next;
    });
  };

  const doSubmit = () => {
    if (!test) return;
    if (timerRef.current) clearInterval(timerRef.current);
    const timeTaken = test.questions.length * 60 - timeLeft;

    const formattedAnswers = Object.entries(answers).map(([qId, sIdx]) => ({
      questionId: Number(qId),
      selectedIndex: sIdx,
    }));

    sessionStorage.setItem(
      "qovo_test_session",
      JSON.stringify({
        testId: test.id,
        testTitle: test.titleBn,
        questions: shuffled,
        answers,
        timeTakenSeconds: timeTaken,
        flaggedIds: Array.from(flagged),
      }),
    );

    submitMutation.mutate(
      { id: test.id, data: { answers: formattedAnswers, timeTakenSeconds: timeTaken } },
      { onSuccess: () => setLocation(`/tests/${test.id}/result`) },
    );
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-12 w-full max-w-sm mx-auto" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (!test) return <div>Test not found</div>;

  if (!started) {
    const duration = test.questions.length;
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto mt-12"
      >
        <Card className="border-border shadow-lg overflow-hidden">
          <div className="h-2 qovo-gradient" />
          <CardContent className="p-8 md:p-12 text-center space-y-6">
            <h1 className="text-3xl font-bold">{test.titleBn}</h1>
            <p className="text-muted-foreground text-lg">{test.description}</p>

            <div className="grid grid-cols-3 gap-4 py-6 border-y border-border">
              <div className="text-center">
                <p className="text-3xl font-bold qovo-gradient-text">{test.questions.length}</p>
                <p className="text-sm text-muted-foreground mt-1">প্রশ্ন</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold qovo-gradient-text">{duration}</p>
                <p className="text-sm text-muted-foreground mt-1">মিনিট</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold qovo-gradient-text">১</p>
                <p className="text-sm text-muted-foreground mt-1">মিনিট/প্রশ্ন</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 text-sm text-muted-foreground text-left bg-muted/40 rounded-xl p-4">
              <p className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                প্রশ্ন ও অপশন প্রতিবার এলোমেলো হবে
              </p>
              <p className="flex items-center gap-2">
                <Flag className="w-4 h-4 text-orange-500 flex-shrink-0" />
                কঠিন প্রশ্ন ফ্ল্যাগ করে পরে রিভিউ করতে পারবে
              </p>
              <p className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary flex-shrink-0" />
                সময় শেষ হলে স্বয়ংক্রিয়ভাবে জমা হবে
              </p>
            </div>

            <Button
              size="lg"
              className="w-full text-lg h-14 rounded-xl qovo-gradient text-white border-0 qovo-glow"
              onClick={() => setStarted(true)}
            >
              টেস্ট শুরু করুন →
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const answeredCount = Object.keys(answers).length;
  const totalCount = shuffled.length;
  const flaggedCount = flagged.size;
  const progressPct = (answeredCount / totalCount) * 100;
  const isLowTime = timeLeft < 60;
  const isWarningTime = timeLeft < 300;

  return (
    <div className="max-w-3xl mx-auto pb-[160px] md:pb-36">
      {/* Sticky Timer Bar */}
      <div className="sticky top-0 z-30 bg-background/90 backdrop-blur border-b border-border py-3 mb-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="text-sm font-medium text-muted-foreground">
              {answeredCount}/{totalCount} উত্তর
            </div>
            {flaggedCount > 0 && (
              <div className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/40 text-orange-600">
                <Flag className="w-3 h-3" /> {flaggedCount} ফ্ল্যাগ
              </div>
            )}
          </div>

          <div
            className={cn(
              "flex items-center gap-2 font-mono text-xl font-bold px-5 py-2 rounded-2xl transition-all",
              isLowTime
                ? "bg-destructive/10 text-destructive animate-pulse"
                : isWarningTime
                  ? "bg-orange-100 dark:bg-orange-950/40 text-orange-600"
                  : "bg-primary/10 text-primary",
            )}
          >
            <Clock className="w-5 h-5" />
            {minutes.toString().padStart(2, "0")}:{seconds.toString().padStart(2, "0")}
          </div>

          <Button
            size="sm"
            onClick={() => setShowSubmitModal(true)}
            disabled={submitMutation.isPending}
            className="qovo-gradient text-white border-0 rounded-xl"
          >
            {submitMutation.isPending ? "জমা হচ্ছে..." : "জমা দিন"}
          </Button>
        </div>
        <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full qovo-gradient"
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </div>

      {/* All Questions Vertical Scroll */}
      <div className="space-y-6">
        {shuffled.map((q, idx) => {
          const isFlagged = flagged.has(q.id);
          const isAnswered = answers[q.id] !== undefined;
          const hintShown = hintsUsed.has(q.id);

          return (
            <motion.div
              key={q.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(idx * 0.04, 0.4) }}
            >
              <Card
                className={cn(
                  "border-2 transition-all duration-200",
                  isFlagged
                    ? "border-orange-400 dark:border-orange-600"
                    : isAnswered
                      ? "border-primary/30"
                      : "border-border",
                )}
              >
                <CardContent className="p-5 md:p-6">
                  {/* Question header */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="flex-shrink-0 w-7 h-7 rounded-full qovo-gradient text-white text-xs font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span
                        className={cn(
                          "text-xs px-2 py-0.5 rounded-full font-medium",
                          q.difficulty === "easy"
                            ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300"
                            : q.difficulty === "medium"
                              ? "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300"
                              : "bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300",
                        )}
                      >
                        {q.difficulty === "easy" ? "সহজ" : q.difficulty === "medium" ? "মাঝারি" : "কঠিন"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => setHintsUsed((prev) => { const next = new Set(prev); next.add(q.id); return next; })}
                        disabled={hintShown}
                        className={cn(
                          "flex items-center gap-1 text-xs px-2.5 py-1 rounded-full transition-all",
                          hintShown
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                            : "bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:hover:bg-amber-950/60 dark:text-amber-300",
                        )}
                      >
                        <Lightbulb className={cn("w-3 h-3", hintShown && "fill-current")} />
                        সংকেত
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleFlag(q.id)}
                        className={cn(
                          "flex items-center gap-1 text-xs px-2.5 py-1 rounded-full transition-all",
                          isFlagged
                            ? "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300"
                            : "bg-muted hover:bg-orange-50 text-muted-foreground hover:text-orange-600",
                        )}
                      >
                        <Flag className={cn("w-3 h-3", isFlagged && "fill-current")} />
                        {isFlagged ? "ফ্ল্যাগড" : "ফ্ল্যাগ"}
                      </button>
                    </div>
                  </div>

                  <h3 className="text-base md:text-lg font-bold text-foreground leading-relaxed mb-4">
                    {q.questionText}
                  </h3>

                  <AnimatePresence>
                    {hintShown && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden mb-4"
                      >
                        <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-100 text-sm">
                          💡{" "}
                          {q.hint && q.hint.trim().length > 0 ? q.hint : "মূল ধারণা ও সংজ্ঞা মনে করার চেষ্টা করো।"}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Options */}
                  <div className="grid gap-2.5">
                    {q.displayOrder.map((originalIdx, displayIdx) => {
                      const option = q.options[originalIdx];
                      const isSelected = answers[q.id] === originalIdx;

                      return (
                        <motion.button
                          key={displayIdx}
                          whileHover={{ scale: 1.005 }}
                          whileTap={{ scale: 0.995 }}
                          onClick={() => handleSelect(q.id, originalIdx)}
                          className={cn(
                            "flex items-center p-3.5 rounded-xl border-2 text-left transition-all duration-150 w-full",
                            isSelected
                              ? "border-primary bg-primary/5 text-primary shadow-sm"
                              : "border-border hover:border-primary/40 hover:bg-muted/40 bg-card",
                          )}
                        >
                          <div
                            className={cn(
                              "w-7 h-7 rounded-full border-2 flex items-center justify-center mr-3 font-semibold text-xs flex-shrink-0 transition-all",
                              isSelected
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-muted-foreground/30 text-muted-foreground",
                            )}
                          >
                            {String.fromCharCode(65 + displayIdx)}
                          </div>
                          <span className="font-medium text-sm">{option}</span>
                          {isSelected && (
                            <CheckCircle2 className="w-4 h-4 ml-auto text-primary flex-shrink-0" />
                          )}
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

      {/* Bottom Submit */}
      <div className="fixed bottom-16 md:bottom-0 left-0 right-0 border-t border-border py-4 px-4 z-[60]"
        style={{ background: "hsl(var(--background) / 0.97)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)" }}>
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground">
            {totalCount - answeredCount > 0 ? (
              <span className="text-orange-500 font-medium">
                ⚠️ {totalCount - answeredCount}টি প্রশ্নের উত্তর দেওয়া হয়নি
              </span>
            ) : (
              <span className="text-emerald-500 font-medium">✅ সব প্রশ্নের উত্তর দেওয়া হয়েছে</span>
            )}
          </div>
          <Button
            size="lg"
            onClick={() => setShowSubmitModal(true)}
            disabled={submitMutation.isPending}
            className="qovo-gradient text-white border-0 rounded-xl px-8"
          >
            {submitMutation.isPending ? "জমা হচ্ছে..." : "জমা দিন →"}
          </Button>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      <AnimatePresence>
        {showSubmitModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setShowSubmitModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card border border-border rounded-2xl p-8 max-w-sm w-full shadow-2xl text-center space-y-4"
            >
              <div className="w-16 h-16 mx-auto rounded-full qovo-gradient flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold">টেস্ট জমা দিবেন?</h3>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>উত্তর দেওয়া: <strong className="text-foreground">{answeredCount}/{totalCount}</strong></p>
                {flaggedCount > 0 && (
                  <p>ফ্ল্যাগ করা: <strong className="text-orange-500">{flaggedCount}টি</strong></p>
                )}
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowSubmitModal(false)}>
                  আরও দেখি
                </Button>
                <Button
                  className="flex-1 qovo-gradient text-white border-0"
                  onClick={() => { setShowSubmitModal(false); doSubmit(); }}
                  disabled={submitMutation.isPending}
                >
                  হ্যাঁ, জমা দিন
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
