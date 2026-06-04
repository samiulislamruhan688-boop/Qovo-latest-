import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, ChevronRight, BookOpen, Database,
  Hash, Layers, BookMarked, Trash2, Eye, EyeOff,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MathText } from "@/components/MathText";
import { cn } from "@/lib/utils";

function apiUrl(path: string) {
  return `/api${path}`;
}

type SourceRow = { source: string; count: number };
type SubjectRow = { subjectId: number; subjectName: string; subjectColor: string; subjectIcon: string; count: number };
type ChapterRow = { chapterId: number; chapterName: string; orderIndex: number; count: number };
type QuestionRow = {
  id: number; questionText: string; options: string[];
  correctIndex: number; explanation: string; difficulty: string;
  source: string | null; year: number | null; hint: string | null;
};

type Step = "sources" | "subjects" | "chapters" | "questions";

export default function SourcePage() {
  const [step, setStep] = useState<Step>("sources");
  const [selSource, setSelSource] = useState("");
  const [selSubject, setSelSubject] = useState<SubjectRow | null>(null);
  const [selChapter, setSelChapter] = useState<ChapterRow | null>(null);
  const [revealedAnswers, setRevealedAnswers] = useState<Set<number>>(new Set());
  const adminMode = typeof localStorage !== "undefined" && localStorage.getItem("qovo-admin-mode") === "1";
  const [deletedIds, setDeletedIds] = useState<Set<number>>(new Set());
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const { data: sources, isLoading: loadingSources } = useQuery<SourceRow[]>({
    queryKey: ["source-nav-sources"],
    queryFn: () => fetch(apiUrl("/source-nav/sources")).then((r) => r.json()),
  });

  const { data: subjects, isLoading: loadingSubjects } = useQuery<SubjectRow[]>({
    queryKey: ["source-nav-subjects", selSource],
    queryFn: () => fetch(apiUrl(`/source-nav/subjects?source=${encodeURIComponent(selSource)}`)).then((r) => r.json()),
    enabled: !!selSource,
  });

  const { data: chaptersData, isLoading: loadingChapters } = useQuery<ChapterRow[]>({
    queryKey: ["source-nav-chapters", selSource, selSubject?.subjectId],
    queryFn: () =>
      fetch(apiUrl(`/source-nav/chapters?source=${encodeURIComponent(selSource)}&subjectId=${selSubject!.subjectId}`)).then((r) => r.json()),
    enabled: !!selSource && !!selSubject,
  });

  const { data: questionsData, isLoading: loadingQuestions } = useQuery<QuestionRow[]>({
    queryKey: ["source-nav-questions", selSource, selChapter?.chapterId],
    queryFn: () =>
      fetch(apiUrl(`/source-nav/questions?source=${encodeURIComponent(selSource)}&chapterId=${selChapter!.chapterId}`)).then((r) => r.json()),
    enabled: !!selSource && !!selChapter,
  });

  const toggleReveal = (id: number) => {
    setRevealedAnswers((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleDelete = async (id: number) => {
    try {
      await fetch(apiUrl(`/questions/${id}`), { method: "DELETE" });
      setDeletedIds((prev) => new Set([...prev, id]));
      setDeleteConfirmId(null);
    } catch { /* silent */ }
  };

  const goBack = () => {
    if (step === "questions") { setStep("chapters"); setSelChapter(null); setRevealedAnswers(new Set()); setDeleteConfirmId(null); }
    else if (step === "chapters") { setStep("subjects"); setSelChapter(null); }
    else if (step === "subjects") { setStep("sources"); setSelSubject(null); }
  };

  const visibleQuestions = (questionsData ?? []).filter((q) => !deletedIds.has(q.id));

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        {step !== "sources" && (
          <button type="button" onClick={goBack}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors -ml-1">
            <ChevronLeft className="w-4 h-4" /> ফিরে যান
          </button>
        )}
        <div className="flex-1">
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Database className="w-5 h-5 text-primary" />
            উৎস অনুযায়ী প্রশ্ন
          </h1>
          {/* Breadcrumb */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1 flex-wrap">
            <button type="button" onClick={() => { setStep("sources"); setSelSource(""); setSelSubject(null); setSelChapter(null); }}
              className={cn("hover:text-foreground transition-colors", step === "sources" && "text-primary font-medium")}>
              সব উৎস
            </button>
            {selSource && (
              <>
                <ChevronRight className="w-3 h-3" />
                <button type="button" onClick={() => { setStep("subjects"); setSelChapter(null); }}
                  className={cn("hover:text-foreground transition-colors", step === "subjects" && "text-primary font-medium")}>
                  {selSource}
                </button>
              </>
            )}
            {selSubject && (
              <>
                <ChevronRight className="w-3 h-3" />
                <button type="button" onClick={() => { setStep("chapters"); setSelChapter(null); }}
                  className={cn("hover:text-foreground transition-colors", step === "chapters" && "text-primary font-medium")}>
                  {selSubject.subjectName}
                </button>
              </>
            )}
            {selChapter && (
              <>
                <ChevronRight className="w-3 h-3" />
                <span className="text-primary font-medium">{selChapter.chapterName}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* ── Step 1: Sources ── */}
        {step === "sources" && (
          <motion.div key="sources" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
            {loadingSources ? (
              <div className="grid gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 rounded-xl" />
                ))}
              </div>
            ) : !sources?.length ? (
              <div className="text-center py-16 text-muted-foreground">
                <Database className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-base font-medium">কোনো উৎস পাওয়া যায়নি</p>
                <p className="text-sm mt-1">প্রশ্ন আমদানি করার সময় @source ট্যাগ ব্যবহার করুন</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {sources.map((src) => (
                  <motion.button
                    key={src.source}
                    type="button"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => { setSelSource(src.source); setStep("subjects"); }}
                    className="flex items-center justify-between p-4 rounded-xl border-2 border-border bg-card hover:border-primary/50 hover:bg-muted/50 text-left transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: "var(--qovo-gradient-soft)" }}>
                        <BookOpen className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-semibold text-foreground">{src.source}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{src.count}টি প্রশ্ন</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </motion.button>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ── Step 2: Subjects ── */}
        {step === "subjects" && (
          <motion.div key="subjects" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
            {loadingSubjects ? (
              <div className="grid gap-3">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
              </div>
            ) : !subjects?.length ? (
              <div className="text-center py-12 text-muted-foreground">কোনো বিষয় পাওয়া যায়নি</div>
            ) : (
              <div className="grid gap-3">
                {subjects.map((subj) => (
                  <motion.button key={subj.subjectId} type="button"
                    whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                    onClick={() => { setSelSubject(subj); setStep("chapters"); }}
                    className="flex items-center justify-between p-4 rounded-xl border-2 border-border bg-card hover:border-primary/50 hover:bg-muted/50 text-left transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: `${subj.subjectColor}20`, border: `1.5px solid ${subj.subjectColor}40` }}>
                        <Layers className="w-5 h-5" style={{ color: subj.subjectColor }} />
                      </div>
                      <div>
                        <div className="font-semibold text-foreground">{subj.subjectName}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{subj.count}টি প্রশ্ন</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </motion.button>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ── Step 3: Chapters ── */}
        {step === "chapters" && (
          <motion.div key="chapters" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
            {loadingChapters ? (
              <div className="grid gap-3">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
              </div>
            ) : !chaptersData?.length ? (
              <div className="text-center py-12 text-muted-foreground">কোনো অধ্যায় পাওয়া যায়নি</div>
            ) : (
              <div className="grid gap-3">
                {chaptersData.map((ch, idx) => (
                  <motion.button key={ch.chapterId} type="button"
                    whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                    onClick={() => { setSelChapter(ch); setStep("questions"); }}
                    className="flex items-center justify-between p-4 rounded-xl border-2 border-border bg-card hover:border-primary/50 hover:bg-muted/50 text-left transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center font-bold text-sm text-primary">
                        {idx + 1}
                      </div>
                      <div>
                        <div className="font-semibold text-foreground">{ch.chapterName}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{ch.count}টি প্রশ্ন</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </motion.button>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ── Step 4: Questions ── */}
        {step === "questions" && (
          <motion.div key="questions" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
            {loadingQuestions ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
              </div>
            ) : !visibleQuestions.length ? (
              <div className="text-center py-12 text-muted-foreground">
                <BookMarked className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>এই অধ্যায়ে কোনো প্রশ্ন নেই</p>
              </div>
            ) : (
              <div className="space-y-4 pb-6">
                <div className="text-sm text-muted-foreground">
                  মোট {visibleQuestions.length}টি প্রশ্ন
                </div>
                {visibleQuestions.map((q, idx) => {
                  const revealed = revealedAnswers.has(q.id);
                  const isConfirming = deleteConfirmId === q.id;
                  return (
                    <Card key={q.id} className="border-border shadow-sm overflow-hidden">
                      <CardContent className="p-5">
                        {/* Question header */}
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="flex-shrink-0 w-7 h-7 rounded-full text-white text-xs font-bold flex items-center justify-center"
                              style={{ background: "var(--qovo-gradient)" }}>
                              {idx + 1}
                            </span>
                            <span className={cn(
                              "text-xs px-2 py-0.5 rounded-full font-medium",
                              q.difficulty === "easy" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                                : q.difficulty === "medium" ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                                : "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300"
                            )}>
                              {q.difficulty === "easy" ? "সহজ" : q.difficulty === "medium" ? "মাঝারি" : "কঠিন"}
                            </span>
                            <span className="text-xs text-muted-foreground font-mono opacity-60">#{q.id}</span>
                          </div>
                          {/* Admin delete controls */}
                          {adminMode && !isConfirming && (
                            <button type="button" onClick={() => setDeleteConfirmId(q.id)}
                              className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {adminMode && isConfirming && (
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <span className="text-xs text-destructive font-medium">মুছবেন?</span>
                              <button type="button" onClick={() => handleDelete(q.id)}
                                className="text-xs px-2 py-1 rounded-lg bg-destructive text-white font-semibold">
                                হ্যাঁ
                              </button>
                              <button type="button" onClick={() => setDeleteConfirmId(null)}
                                className="text-xs px-2 py-1 rounded-lg bg-muted text-foreground">
                                না
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Question text */}
                        <div className="text-base font-semibold text-foreground leading-relaxed mb-4">
                          <MathText>{q.questionText}</MathText>
                        </div>

                        {/* Options */}
                        <div className="space-y-2 mb-4">
                          {q.options.map((opt, i) => (
                            <div key={i}
                              className={cn(
                                "flex items-center gap-3 p-3 rounded-xl border text-sm",
                                revealed && i === q.correctIndex
                                  ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-100 font-medium"
                                  : "border-border bg-muted/30 text-muted-foreground"
                              )}>
                              <span className={cn(
                                "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                                revealed && i === q.correctIndex
                                  ? "bg-emerald-500 text-white"
                                  : "bg-muted text-muted-foreground"
                              )}>
                                {String.fromCharCode(65 + i)}
                              </span>
                              <MathText>{opt}</MathText>
                            </div>
                          ))}
                        </div>

                        {/* Reveal toggle */}
                        <button type="button" onClick={() => toggleReveal(q.id)}
                          className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors">
                          {revealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          {revealed ? "উত্তর লুকান" : "সঠিক উত্তর দেখুন"}
                        </button>

                        {/* Explanation */}
                        {revealed && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                            className="mt-3 pt-3 border-t border-border">
                            <div className="flex items-center gap-1 text-xs font-semibold text-muted-foreground mb-1">
                              <Hash className="w-3 h-3" /> ব্যাখ্যা
                            </div>
                            <p className="text-sm leading-relaxed text-foreground">
                              <MathText>{q.explanation}</MathText>
                            </p>
                          </motion.div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
