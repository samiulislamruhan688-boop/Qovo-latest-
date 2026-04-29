import { useState, useMemo } from "react";
import { useListQuestionsByChapter, useSubmitPracticeAnswer } from "@workspace/api-client-react";
import { useRoute, Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, ArrowRight, ChevronLeft, Trophy, Lightbulb } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function Practice() {
  const [, params] = useRoute("/practice/:chapterId");
  const chapterId = Number(params?.chapterId);

  const { data: questions, isLoading } = useListQuestionsByChapter(chapterId, {
    query: { enabled: !!chapterId, queryKey: ["/api/chapters", chapterId, "questions"] }
  });

  const submitAnswer = useSubmitPracticeAnswer();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answerResult, setAnswerResult] = useState<{correct: boolean, correctIndex: number, explanation: string, pointsEarned: number} | null>(null);
  
  const currentQuestion = questions?.[currentIndex];
  const isLastQuestion = questions && currentIndex === questions.length - 1;
  const isCompleted = questions && currentIndex >= questions.length;

  const handleSelectOption = (index: number) => {
    if (selectedOption !== null || !currentQuestion) return; // Prevent multiple clicks
    
    setSelectedOption(index);
    submitAnswer.mutate({
      data: { questionId: currentQuestion.id, selectedIndex: index }
    }, {
      onSuccess: (result) => {
        setAnswerResult(result);
      }
    });
  };

  const handleNext = () => {
    setSelectedOption(null);
    setAnswerResult(null);
    setCurrentIndex(prev => prev + 1);
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!questions || questions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <h2 className="text-2xl font-bold mb-4">কোনো প্রশ্ন পাওয়া যায়নি</h2>
        <Link href="/subjects">
          <Button>ফিরে যান</Button>
        </Link>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="max-w-md mx-auto text-center py-20 space-y-6">
        <motion.div 
          initial={{ scale: 0 }} 
          animate={{ scale: 1 }} 
          className="w-24 h-24 mx-auto bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center"
        >
          <Trophy className="w-12 h-12" />
        </motion.div>
        <h2 className="text-3xl font-bold">অনুশীলন সম্পন্ন!</h2>
        <p className="text-muted-foreground">আপনি এই অধ্যায়ের সব প্রশ্ন শেষ করেছেন।</p>
        <div className="flex gap-4 justify-center pt-4">
          <Link href="/subjects">
            <Button variant="outline">অন্য বিষয়</Button>
          </Link>
          <Button onClick={() => { setCurrentIndex(0); setAnswerResult(null); setSelectedOption(null); }}>
            আবার চেষ্টা করুন
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-center justify-between mb-4">
        <Link href={`/subjects`}>
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            <ChevronLeft className="w-4 h-4 mr-1" /> ফিরে যান
          </Button>
        </Link>
        <div className="text-sm font-medium text-muted-foreground">
          প্রশ্ন {currentIndex + 1} / {questions.length}
        </div>
      </div>

      <Progress value={((currentIndex) / questions.length) * 100} className="h-2" />

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
          <Card className="border-border shadow-md">
            <CardContent className="p-6 md:p-8">
              <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground mb-4">
                {currentQuestion?.difficulty === 'easy' ? 'সহজ' : currentQuestion?.difficulty === 'medium' ? 'মাঝারি' : 'কঠিন'}
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-foreground leading-relaxed">
                {currentQuestion?.questionText}
              </h2>
            </CardContent>
          </Card>

          <div className="grid gap-3">
            {currentQuestion?.options.map((option, index) => {
              const isSelected = selectedOption === index;
              const isSubmitted = selectedOption !== null;
              const isCorrect = answerResult?.correctIndex === index;
              const isWrongSelected = isSelected && !isCorrect;

              return (
                <button
                  key={index}
                  onClick={() => handleSelectOption(index)}
                  disabled={isSubmitted || submitAnswer.isPending}
                  className={cn(
                    "relative flex items-center p-4 rounded-xl border-2 text-left transition-all",
                    !isSubmitted && "border-border hover:border-primary/50 hover:bg-muted/50 bg-card",
                    isSubmitted && isCorrect && "border-green-500 bg-green-50 dark:bg-green-950/20 text-green-900 dark:text-green-100",
                    isSubmitted && isWrongSelected && "border-destructive bg-destructive/10 text-destructive",
                    isSubmitted && !isCorrect && !isWrongSelected && "border-border bg-muted/50 opacity-50 cursor-not-allowed"
                  )}
                >
                  <div className={cn(
                    "flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center mr-4 font-semibold text-sm",
                    !isSubmitted && "border-border text-muted-foreground",
                    isSubmitted && isCorrect && "border-green-500 bg-green-500 text-white",
                    isSubmitted && isWrongSelected && "border-destructive bg-destructive text-white",
                    isSubmitted && !isCorrect && !isWrongSelected && "border-border text-muted-foreground"
                  )}>
                    {String.fromCharCode(65 + index)}
                  </div>
                  <span className="flex-1 font-medium">{option}</span>
                  
                  {isSubmitted && isCorrect && <CheckCircle2 className="w-6 h-6 text-green-500 absolute right-4" />}
                  {isSubmitted && isWrongSelected && <XCircle className="w-6 h-6 text-destructive absolute right-4" />}
                </button>
              );
            })}
          </div>

          <AnimatePresence>
            {answerResult && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: "auto", marginTop: 24 }}
                className="overflow-hidden"
              >
                <Card className={cn(
                  "border-l-4",
                  answerResult.correct ? "border-l-green-500" : "border-l-orange-500"
                )}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        "p-2 rounded-full",
                        answerResult.correct ? "bg-green-100 text-green-600 dark:bg-green-900/30" : "bg-orange-100 text-orange-600 dark:bg-orange-900/30"
                      )}>
                        <Lightbulb className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg mb-2">
                          {answerResult.correct ? "সঠিক উত্তর!" : "সঠিক উত্তরটি হলো:"}
                        </h3>
                        {!answerResult.correct && currentQuestion && (
                          <p className="font-medium text-foreground mb-3 p-3 bg-muted rounded-lg">
                            {currentQuestion.options[answerResult.correctIndex]}
                          </p>
                        )}
                        <p className="text-muted-foreground leading-relaxed">
                          {answerResult.explanation}
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-6 flex justify-end">
                      <Button onClick={handleNext} size="lg" className="rounded-full px-8">
                        {isLastQuestion ? "শেষ করুন" : "পরবর্তী প্রশ্ন"} <ArrowRight className="w-5 h-5 ml-2" />
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
