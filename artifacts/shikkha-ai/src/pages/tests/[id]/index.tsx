import { useState, useEffect, useMemo } from "react";
import { useGetTest, useSubmitTest } from "@workspace/api-client-react";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, ChevronRight, ChevronLeft, Flag, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default function TestTaking() {
  const [, params] = useRoute("/tests/:testId");
  const testId = Number(params?.testId);
  const [, setLocation] = useLocation();

  const { data: test, isLoading } = useGetTest(testId, {
    query: { enabled: !!testId, queryKey: ["/api/tests", testId] }
  });

  const submitMutation = useSubmitTest();

  const [started, setStarted] = useState(false);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [markedForReview, setMarkedForReview] = useState<Record<number, boolean>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [hintsUsed, setHintsUsed] = useState<Record<number, boolean>>({});
  const [shuffleSeed, setShuffleSeed] = useState(0);

  // Build shuffled question + options ordering once when the test is started
  const shuffled = useMemo(() => {
    if (!test || !started) return [] as { id: number; questionText: string; difficulty: string; hint?: string | null; options: string[]; displayOrder: number[] }[];
    return shuffleArray(test.questions).map((q) => ({
      id: q.id,
      questionText: q.questionText,
      difficulty: q.difficulty,
      hint: (q as { hint?: string | null }).hint ?? null,
      options: q.options,
      displayOrder: shuffleArray(q.options.map((_, i) => i)),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [test, started, shuffleSeed]);

  useEffect(() => {
    if (test && started && timeLeft === 0) {
      // Initialize timer
      setTimeLeft(test.durationMinutes * 60);
    }
  }, [test, started]);

  useEffect(() => {
    if (!started || timeLeft <= 0) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [started, timeLeft]);

  const handleSelect = (questionId: number, optionIndex: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
  };

  const toggleMark = (questionIndex: number) => {
    setMarkedForReview(prev => ({ ...prev, [questionIndex]: !prev[questionIndex] }));
  };

  const handleSubmit = () => {
    if (!test) return;

    const formattedAnswers = Object.entries(answers).map(([qId, sIdx]) => ({
      questionId: Number(qId),
      selectedIndex: sIdx,
    }));

    const timeTaken = test.durationMinutes * 60 - timeLeft;

    submitMutation.mutate({
      id: test.id,
      data: { answers: formattedAnswers, timeTakenSeconds: timeTaken }
    }, {
      onSuccess: () => {
        setLocation(`/tests/${test.id}/result`);
      }
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-12 w-full max-w-sm mx-auto" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (!test) return <div>Test not found</div>;

  if (!started) {
    return (
      <div className="max-w-2xl mx-auto mt-12">
        <Card className="border-border shadow-lg">
          <CardContent className="p-8 md:p-12 text-center space-y-6">
            <h1 className="text-3xl font-bold">{test.titleBn}</h1>
            <p className="text-muted-foreground text-lg">{test.description}</p>
            
            <div className="flex items-center justify-center gap-8 py-6 border-y border-border">
              <div className="text-center">
                <p className="text-3xl font-bold qovo-gradient-text">{test.durationMinutes}</p>
                <p className="text-sm text-muted-foreground">মিনিট</p>
              </div>
              <div className="w-px h-12 bg-border" />
              <div className="text-center">
                <p className="text-3xl font-bold qovo-gradient-text">{test.questions.length}</p>
                <p className="text-sm text-muted-foreground">প্রশ্ন</p>
              </div>
            </div>

            <div className="text-xs text-muted-foreground">
              প্রতিবার প্রশ্ন ও অপশন এলোমেলো হবে — ভিন্ন অভিজ্ঞতা প্রতিবার!
            </div>

            <Button
              size="lg"
              className="w-full text-lg h-14 rounded-xl qovo-gradient text-white border-0 qovo-glow"
              onClick={() => {
                setShuffleSeed((s) => s + 1);
                setStarted(true);
              }}
            >
              শুরু করুন
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = shuffled[currentIndex];
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  if (!currentQuestion) return null;

  return (
    <div className="max-w-6xl mx-auto grid md:grid-cols-[1fr_300px] gap-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between bg-card p-4 rounded-2xl border border-border shadow-sm sticky top-0 z-10">
          <div className="font-bold text-lg text-foreground">
            প্রশ্ন {currentIndex + 1} <span className="text-muted-foreground font-normal text-sm">/ {test.questions.length}</span>
          </div>
          <div className={cn(
            "flex items-center gap-2 font-mono text-xl font-bold px-4 py-2 rounded-xl",
            timeLeft < 60 ? "bg-destructive/10 text-destructive animate-pulse" : "bg-primary/10 text-primary"
          )}>
            <Clock className="w-5 h-5" />
            {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
          </div>
        </div>

        {/* Question */}
        <Card className="border-border shadow-sm">
          <CardContent className="p-6 md:p-8">
            <div className="flex items-start justify-between gap-4 mb-6">
              <h2 className="text-xl md:text-2xl font-bold leading-relaxed flex-1">
                {currentQuestion.questionText}
              </h2>
              <button
                type="button"
                onClick={() =>
                  setHintsUsed((p) => ({ ...p, [currentQuestion.id]: true }))
                }
                disabled={hintsUsed[currentQuestion.id]}
                className={cn(
                  "flex-shrink-0 flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-all",
                  hintsUsed[currentQuestion.id]
                    ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 cursor-default"
                    : "bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:hover:bg-amber-950/60 dark:text-amber-300 hover:scale-105",
                )}
                title="সংকেত (পুরো উত্তর দেখাবে না)"
              >
                <Lightbulb
                  className={cn(
                    "w-3.5 h-3.5",
                    hintsUsed[currentQuestion.id] && "fill-current",
                  )}
                />
                সংকেত
              </button>
            </div>

            {hintsUsed[currentQuestion.id] && (
              <div className="mb-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-100 text-sm">
                💡{" "}
                {currentQuestion.hint && currentQuestion.hint.trim().length > 0
                  ? currentQuestion.hint
                  : "মূল ধারণা ও সংজ্ঞা মনে করার চেষ্টা করো।"}
              </div>
            )}

            <div className="grid gap-3">
              {currentQuestion.displayOrder.map((originalIdx, displayIdx) => {
                const option = currentQuestion.options[originalIdx];
                const isSelected = answers[currentQuestion.id] === originalIdx;
                return (
                  <button
                    key={displayIdx}
                    onClick={() => handleSelect(currentQuestion.id, originalIdx)}
                    className={cn(
                      "flex items-center p-4 rounded-xl border-2 text-left transition-all",
                      isSelected
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border hover:border-primary/30 hover:bg-muted/50",
                    )}
                  >
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full border-2 flex items-center justify-center mr-4 font-medium flex-shrink-0",
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-muted-foreground/30",
                      )}
                    >
                      {String.fromCharCode(65 + displayIdx)}
                    </div>
                    <span className="font-medium text-foreground">{option}</span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button 
            variant="outline" 
            size="lg"
            onClick={() => setCurrentIndex(p => Math.max(0, p - 1))}
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="w-5 h-5 mr-2" /> পূর্ববর্তী
          </Button>
          
          <Button
            variant="outline"
            size="lg"
            className={cn(markedForReview[currentIndex] && "bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-950/30 dark:border-orange-900")}
            onClick={() => toggleMark(currentIndex)}
          >
            <Flag className={cn("w-5 h-5 mr-2", markedForReview[currentIndex] && "fill-current")} />
            রিভিউ এর জন্য চিহ্নিত করুন
          </Button>

          <Button
            variant={currentIndex === shuffled.length - 1 ? "default" : "outline"}
            size="lg"
            className={cn(
              currentIndex === shuffled.length - 1 && "qovo-gradient text-white border-0",
            )}
            onClick={() => {
              if (currentIndex === shuffled.length - 1) {
                if (window.confirm("আপনি কি টেস্ট জমা দিতে চান?")) {
                  handleSubmit();
                }
              } else {
                setCurrentIndex((p) => Math.min(shuffled.length - 1, p + 1));
              }
            }}
            disabled={submitMutation.isPending}
          >
            {currentIndex === shuffled.length - 1 ? (
              submitMutation.isPending ? (
                "জমা হচ্ছে..."
              ) : (
                "জমা দিন"
              )
            ) : (
              <>
                পরবর্তী <ChevronRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Palette */}
      <div className="space-y-4">
        <Card className="border-border sticky top-4">
          <CardContent className="p-4">
            <h3 className="font-bold mb-4 text-sm uppercase tracking-wider text-muted-foreground">প্রশ্নের তালিকা</h3>
            <div className="grid grid-cols-5 gap-2">
              {shuffled.map((q, idx) => {
                const isAnswered = answers[q.id] !== undefined;
                const isMarked = markedForReview[idx];
                const isActive = currentIndex === idx;
                
                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={cn(
                      "w-10 h-10 rounded-lg text-sm font-medium flex items-center justify-center border transition-colors relative",
                      isActive ? "ring-2 ring-primary border-primary bg-primary text-primary-foreground" :
                      isAnswered ? "bg-primary/20 border-primary/30 text-primary" : "border-border bg-card hover:bg-muted",
                    )}
                  >
                    {idx + 1}
                    {isMarked && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full border-2 border-card" />
                    )}
                  </button>
                );
              })}
            </div>
            
            <div className="mt-6 pt-6 border-t border-border space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-primary/20 border border-primary/30" />
                <span>উত্তর দেওয়া হয়েছে</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-card border border-border" />
                <span>উত্তর দেওয়া হয়নি</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-card border border-border relative">
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full" />
                </div>
                <span>রিভিউ এর জন্য চিহ্নিত</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
