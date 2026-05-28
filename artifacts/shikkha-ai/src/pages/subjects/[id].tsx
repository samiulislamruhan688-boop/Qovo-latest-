import { useState, useMemo } from "react";
import { useListChaptersBySubject, useListSubjects } from "@workspace/api-client-react";
import { Link, useRoute, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  ChevronRight,
  PlayCircle,
  BookOpen,
  CheckSquare,
  Square,
  Layers,
  Shuffle,
  HelpCircle,
  ArrowLeft,
  Zap,
  CheckCheck,
} from "lucide-react";
import * as Icons from "lucide-react";

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30",
  medium: "text-amber-600 bg-amber-50 dark:bg-amber-950/30",
  hard: "text-red-600 bg-red-50 dark:bg-red-950/30",
};

export default function SubjectDetail() {
  const [, params] = useRoute("/subjects/:subjectId");
  const [, navigate] = useLocation();
  const subjectId = Number(params?.subjectId);

  const { data: chapters, isLoading } = useListChaptersBySubject(subjectId, {
    query: { enabled: !!subjectId, queryKey: ["/api/subjects", subjectId, "chapters"] },
  });
  const { data: subjects } = useListSubjects();
  const subject = subjects?.find((s) => s.id === subjectId);

  const [selectedChapters, setSelectedChapters] = useState<Set<number>>(new Set());

  const totalQuestions = useMemo(
    () => chapters?.reduce((s, c) => s + (c.questionCount ?? 0), 0) ?? 0,
    [chapters],
  );
  const selectedCount = selectedChapters.size;
  const selectedQuestionCount = useMemo(
    () =>
      chapters
        ?.filter((c) => selectedChapters.has(c.id))
        .reduce((s, c) => s + (c.questionCount ?? 0), 0) ?? 0,
    [chapters, selectedChapters],
  );

  function toggleChapter(id: number) {
    setSelectedChapters((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelectedChapters(new Set(chapters?.map((c) => c.id) ?? []));
  }

  function clearAll() {
    setSelectedChapters(new Set());
  }

  function startCombinedPractice() {
    if (selectedChapters.size === 0) return;
    const ids = Array.from(selectedChapters).join(",");
    if (selectedChapters.size === 1) {
      navigate(`/practice/${Array.from(selectedChapters)[0]}`);
    } else {
      navigate(`/practice/multi?chapters=${ids}`);
    }
  }

  const SubjectIcon = subject?.icon
    ? ((Icons as unknown as Record<string, Icons.LucideIcon>)[subject.icon] ?? Icons.BookOpen)
    : Icons.BookOpen;

  return (
    <div className="max-w-4xl mx-auto space-y-7">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/subjects" className="hover:text-foreground flex items-center gap-1 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> বিষয়সমূহ
        </Link>
        <ChevronRight className="w-4 h-4 opacity-40" />
        <span className="text-foreground font-medium">{subject?.nameBn ?? "লোড হচ্ছে…"}</span>
      </div>

      {/* Subject hero */}
      {subject && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl border border-border p-7 md:p-8"
          style={{ background: `linear-gradient(135deg, ${subject.color}15, ${subject.color}05)` }}
        >
          <div
            className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-15 -mr-12 -mt-12"
            style={{ background: `radial-gradient(circle, ${subject.color}, transparent 70%)` }}
          />
          <div className="relative z-10 flex flex-col md:flex-row gap-5 items-start md:items-center">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 qovo-glow-sm"
              style={{ backgroundColor: `${subject.color}25`, color: subject.color }}
            >
              <SubjectIcon className="w-8 h-8" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-extrabold text-foreground mb-1">{subject.nameBn}</h1>
              <p className="text-muted-foreground text-sm mb-3">{subject.description}</p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5" /> {chapters?.length ?? 0} অধ্যায়
                </span>
                <span className="flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5" /> {totalQuestions} প্রশ্ন
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Chapter list */}
      <div className="space-y-3">
        {/* Header with select controls */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            অধ্যায়সমূহ
            {chapters && (
              <span className="text-xs font-normal px-2 py-0.5 bg-muted rounded-full text-muted-foreground">
                {chapters.length}টি
              </span>
            )}
          </h2>
          {chapters && chapters.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={selectedCount === chapters.length ? clearAll : selectAll}
                className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border hover:bg-muted transition-colors text-muted-foreground"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                {selectedCount === chapters.length ? "সব বাতিল" : "সব বেছে নাও"}
              </button>
            </div>
          )}
        </div>

        {/* Multi-select tip */}
        {chapters && chapters.length > 1 && (
          <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs text-muted-foreground border border-dashed border-border bg-muted/30">
            <Shuffle className="w-3.5 h-3.5 flex-shrink-0" />
            একাধিক অধ্যায় বেছে নিয়ে একসাথে অনুশীলন করতে পারো
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}
          </div>
        ) : (
          <div className="space-y-2">
            {chapters?.map((chapter, i) => {
              const isSelected = selectedChapters.has(chapter.id);
              const hasQuestions = (chapter.questionCount ?? 0) > 0;
              return (
                <motion.div
                  key={chapter.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={`group relative overflow-hidden rounded-2xl border-2 transition-all duration-200 ${
                    isSelected
                      ? "border-primary/50 shadow-md"
                      : "border-border hover:border-primary/25"
                  }`}
                  style={isSelected ? {
                    background: "var(--qovo-gradient-soft)",
                  } : { background: "hsl(var(--card))" }}
                >
                  <div className="flex items-center p-4 gap-4">
                    {/* Checkbox */}
                    <button
                      type="button"
                      onClick={() => toggleChapter(chapter.id)}
                      disabled={!hasQuestions}
                      className={`flex-shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                        isSelected
                          ? "border-primary bg-primary"
                          : hasQuestions
                          ? "border-border hover:border-primary/50 group-hover:border-primary/40"
                          : "border-border/30 opacity-30 cursor-not-allowed"
                      }`}
                    >
                      {isSelected && <CheckSquare className="w-4 h-4 text-white" />}
                    </button>

                    {/* Chapter number */}
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 transition-all ${
                      isSelected
                        ? "text-white"
                        : "bg-muted text-muted-foreground"
                    }`}
                      style={isSelected ? { background: "var(--qovo-gradient)" } : {}}
                    >
                      {chapter.orderIndex}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-bold text-base transition-colors ${isSelected ? "text-foreground" : "group-hover:text-primary"}`}>
                        {chapter.nameBn}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <HelpCircle className="w-3 h-3" />
                          {hasQuestions ? `${chapter.questionCount} টি প্রশ্ন` : "প্রশ্ন নেই"}
                        </span>
                      </div>
                    </div>

                    {/* Practice single chapter */}
                    {hasQuestions && (
                      <Link href={`/practice/${chapter.id}`}>
                        <button
                          type="button"
                          onClick={(e) => e.stopPropagation()}
                          className="flex-shrink-0 flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition-all text-muted-foreground hover:text-white"
                          style={{}}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLElement).style.background = "var(--qovo-gradient)";
                            (e.currentTarget as HTMLElement).style.color = "white";
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLElement).style.background = "";
                            (e.currentTarget as HTMLElement).style.color = "";
                          }}
                        >
                          <PlayCircle className="w-4 h-4" />
                          <span className="hidden sm:inline">একা অনুশীলন</span>
                        </button>
                      </Link>
                    )}
                  </div>
                </motion.div>
              );
            })}

            {chapters?.length === 0 && (
              <div className="text-center py-14 bg-muted/20 rounded-2xl border border-dashed border-border">
                <BookOpen className="w-8 h-8 mx-auto mb-2 text-muted-foreground opacity-40" />
                <p className="text-muted-foreground text-sm">এই বিষয়ে এখনো কোনো অধ্যায় নেই।</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sticky combined practice button */}
      <AnimatePresence>
        {selectedCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 32 }}
            className="fixed bottom-20 md:bottom-8 left-1/2 -translate-x-1/2 z-40 w-full max-w-sm px-4"
          >
            <button
              type="button"
              onClick={startCombinedPractice}
              className="w-full flex items-center justify-between gap-3 py-4 px-6 rounded-2xl text-white font-bold shadow-2xl qovo-glow"
              style={{ background: "var(--qovo-gradient)" }}
            >
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                <span>
                  {selectedCount === 1
                    ? "এই অধ্যায় অনুশীলন করো"
                    : `${selectedCount}টি অধ্যায় একসাথে`}
                </span>
              </div>
              <span className="bg-white/20 px-2.5 py-1 rounded-lg text-sm">
                {selectedQuestionCount} প্রশ্ন
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom spacer for sticky button */}
      {selectedCount > 0 && <div className="h-20 md:h-10" />}
    </div>
  );
}
