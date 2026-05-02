import { useState } from "react";
import { useWrongAnswers } from "@/hooks/useWrongAnswers";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import {
  BookmarkCheck,
  Trash2,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  BookOpen,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

export default function ReviewPage() {
  const { wrongAnswers, removeWrong, clearAll } = useWrongAnswers();
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [confirmClear, setConfirmClear] = useState(false);

  const toggle = (id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (wrongAnswers.length === 0) {
    return (
      <div className="max-w-xl mx-auto text-center py-20 space-y-4">
        <div className="w-20 h-20 mx-auto bg-emerald-100 dark:bg-emerald-950/30 rounded-full flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10 text-emerald-500" />
        </div>
        <h2 className="text-2xl font-bold">রিভিউ লিস্ট খালি!</h2>
        <p className="text-muted-foreground">
          তোমার কোনো ভুল উত্তর সেভ হয়নি। MCQ অনুশীলন করলে ভুল উত্তরগুলো এখানে জমা হবে।
        </p>
        <Link href="/subjects">
          <Button className="qovo-gradient text-white border-0 mt-2">
            <BookOpen className="w-4 h-4 mr-2" /> অনুশীলন শুরু করো
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookmarkCheck className="w-6 h-6 text-amber-500" />
            রিভিউ লিস্ট
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {wrongAnswers.length}টি ভুল উত্তর সেভ আছে — রিভিউ করে নিজেকে উন্নত করো
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="text-destructive border-destructive/30 hover:bg-destructive/5"
          onClick={() => setConfirmClear(true)}
        >
          <Trash2 className="w-4 h-4 mr-1" /> সব মুছুন
        </Button>
      </div>

      {/* Confirm Clear Modal */}
      <AnimatePresence>
        {confirmClear && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setConfirmClear(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card border border-border rounded-2xl p-7 max-w-sm w-full text-center space-y-4"
            >
              <h3 className="text-lg font-bold">সব রিভিউ মুছে ফেলবেন?</h3>
              <p className="text-sm text-muted-foreground">
                {wrongAnswers.length}টি সেভ করা প্রশ্ন মুছে যাবে।
              </p>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setConfirmClear(false)}>
                  বাতিল
                </Button>
                <Button
                  className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => { clearAll(); setConfirmClear(false); }}
                >
                  হ্যাঁ, মুছুন
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Wrong Answer Cards */}
      <div className="space-y-3">
        {wrongAnswers.map((item, idx) => {
          const isOpen = expanded.has(item.questionId);
          return (
            <motion.div
              key={item.questionId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ delay: idx * 0.03 }}
            >
              <Card className="border-l-4 border-l-orange-400 overflow-hidden">
                <CardContent className="p-4">
                  <div
                    className="flex items-start gap-3 cursor-pointer"
                    onClick={() => toggle(item.questionId)}
                  >
                    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-orange-100 dark:bg-orange-950/40 flex items-center justify-center mt-0.5">
                      <span className="text-orange-600 text-xs font-bold">{idx + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground leading-snug">
                        {item.questionText}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDistanceToNow(new Date(item.savedAt), { addSuffix: true })} সেভ হয়েছে
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeWrong(item.questionId); }}
                        className="w-7 h-7 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive flex items-center justify-center transition-colors"
                        title="এই প্রশ্ন মুছুন"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-4 pl-10 space-y-3">
                          <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900">
                            <XCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs font-semibold text-destructive mb-0.5">তুমি বেছেছিলে:</p>
                              <p className="text-sm text-foreground">{item.selectedOption}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-0.5">সঠিক উত্তর:</p>
                              <p className="text-sm font-medium text-foreground">{item.correctOption}</p>
                            </div>
                          </div>
                          {item.explanation && (
                            <div className={cn(
                              "flex items-start gap-2 p-3 rounded-xl bg-muted/60 border border-border"
                            )}>
                              <BookOpen className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="text-xs font-semibold text-muted-foreground mb-0.5">ব্যাখ্যা:</p>
                                <p className="text-sm text-muted-foreground leading-relaxed">{item.explanation}</p>
                              </div>
                            </div>
                          )}
                          <Link href={`/practice/${item.chapterId}`}>
                            <Button size="sm" variant="outline" className="text-xs h-8">
                              এই অধ্যায়ে আবার অনুশীলন করো →
                            </Button>
                          </Link>
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
    </div>
  );
}
