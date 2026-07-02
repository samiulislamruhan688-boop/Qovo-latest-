import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, ChevronRight, BookOpen, Database,
  Hash, Layers, BookMarked, Trash2, Eye, EyeOff,
  Calendar, BarChart3, Flag, Loader2, Check, X,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MathText } from "@/components/MathText";
import { cn } from "@/lib/utils";

function apiUrl(path: string) { return `/api${path}`; }

type SourceRow     = { source: string; count: number };
type YearRow       = { year: number;   count: number };
type SubjectRow    = { subjectId: number; subjectName: string; subjectColor: string; subjectIcon: string; count: number };
type ChapterRow    = { chapterId: number; chapterName: string; orderIndex: number; count: number };
type QuestionRow   = { id: number; questionText: string; options: string[]; correctIndex: number; explanation: string; difficulty: string; source: string | null; year: number | null; hint: string | null };
type InsightRow    = { totalQuestions: number; totalSubjects: number; totalChapters: number; recentQuestions: { id: number; questionText: string }[] };

type MainTab   = "source" | "year";
type DrillStep = "root" | "subjects" | "chapters" | "questions";

const REASONS = ["ভুল উত্তর", "ভুল LaTeX/সূত্র", "বানান ভুল", "অপূর্ণ প্রশ্ন", "ডুপ্লিকেট", "ভুল ব্যাখ্যা", "অন্যান্য"];

function diffBadge(d: string) {
  return cn("text-xs px-2 py-0.5 rounded-full font-medium",
    d === "easy"   ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
  : d === "medium" ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                   : "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300");
}

// ── Question List (shared by both tabs) ───────────────────────────────────────
function QuestionList({ questions: qs }: { questions: QuestionRow[] }) {
  const qc = useQueryClient();
  const adminMode = (() => { try { return !!sessionStorage.getItem("qovo-admin-token"); } catch { return false; } })();
  const [revealedAnswers, setRevealedAnswers] = useState<Set<number>>(new Set());
  const [deletedIds,      setDeletedIds]      = useState<Set<number>>(new Set());
  const [deleteConfirm,   setDeleteConfirm]   = useState<number | null>(null);
  const [reportId,        setReportId]        = useState<number | null>(null);
  const [reportReason,    setReportReason]    = useState("");
  const [reportDetails,   setReportDetails]   = useState("");
  const [reportBusy,      setReportBusy]      = useState(false);
  const [reportDone,      setReportDone]      = useState<Set<number>>(new Set());

  const toggleReveal = (id: number) =>
    setRevealedAnswers((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const handleTrash = async (id: number) => {
    const token = (() => { try { return sessionStorage.getItem("qovo-admin-token") ?? ""; } catch { return ""; } })();
    await fetch(apiUrl(`/questions/${id}/trash`), { method: "PATCH", headers: { "x-admin-token": token } });
    setDeletedIds((p) => new Set([...p, id]));
    setDeleteConfirm(null);
    qc.invalidateQueries({ queryKey: ["admin-trash"] });
  };

  const handleReport = async (id: number) => {
    if (!reportReason) return;
    setReportBusy(true);
    await fetch(apiUrl(`/questions/${id}/report`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: reportReason, details: reportDetails || null }),
    });
    setReportBusy(false);
    setReportDone((p) => new Set([...p, id]));
    setReportId(null); setReportReason(""); setReportDetails("");
    qc.invalidateQueries({ queryKey: ["admin-reports"] });
  };

  const visible = qs.filter((q) => !deletedIds.has(q.id));

  if (!visible.length) return (
    <div className="text-center py-12 text-muted-foreground">
      <BookMarked className="w-12 h-12 mx-auto mb-3 opacity-30" />
      <p>এই অধ্যায়ে কোনো প্রশ্ন নেই</p>
    </div>
  );

  return (
    <div className="space-y-4 pb-6">
      <div className="text-sm text-muted-foreground">মোট {visible.length}টি প্রশ্ন</div>
      {visible.map((q, idx) => {
        const revealed    = revealedAnswers.has(q.id);
        const isConfirm   = deleteConfirm === q.id;
        const isReporting = reportId === q.id;
        const isDone      = reportDone.has(q.id);
        return (
          <Card key={q.id} className="border-border shadow-sm overflow-hidden">
            <CardContent className="p-5">
              {/* Header */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full text-white text-xs font-bold flex items-center justify-center"
                    style={{ background: "var(--qovo-gradient)" }}>{idx + 1}</span>
                  <span className={diffBadge(q.difficulty)}>
                    {q.difficulty === "easy" ? "সহজ" : q.difficulty === "medium" ? "মাঝারি" : "কঠিন"}
                  </span>
                  {q.year && <span className="text-xs text-muted-foreground font-mono">{q.year}</span>}
                  <span className="text-xs text-muted-foreground font-mono opacity-60">#{q.id}</span>
                </div>
                {adminMode && (
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {/* Report */}
                    {isDone ? (
                      <span className="text-xs text-muted-foreground flex items-center gap-1"><Check className="w-3 h-3" /> রিপোর্ট হয়েছে</span>
                    ) : (
                      <button type="button" onClick={() => { setReportId(isReporting ? null : q.id); setDeleteConfirm(null); setReportReason(""); setReportDetails(""); }}
                        className={cn("w-7 h-7 rounded-lg flex items-center justify-center transition-colors",
                          isReporting ? "bg-orange-100 text-orange-600" : "text-muted-foreground hover:bg-orange-50 hover:text-orange-500")}>
                        <Flag className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {/* Delete */}
                    {!isConfirm ? (
                      <button type="button" onClick={() => { setDeleteConfirm(q.id); setReportId(null); }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-destructive font-medium">ট্র্যাশে?</span>
                        <button type="button" onClick={() => handleTrash(q.id)}
                          className="text-xs px-2 py-1 rounded-lg bg-destructive text-white font-semibold">হ্যাঁ</button>
                        <button type="button" onClick={() => setDeleteConfirm(null)}
                          className="text-xs px-2 py-1 rounded-lg bg-muted text-foreground">না</button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Report dialog */}
              <AnimatePresence>
                {isReporting && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden mb-3">
                    <div className="p-3 rounded-xl border border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-900 space-y-2">
                      <p className="text-xs font-semibold text-orange-700 dark:text-orange-300">সমস্যার কারণ:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {REASONS.map((r) => (
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
                        <button type="button" onClick={() => handleReport(q.id)} disabled={!reportReason || reportBusy}
                          className="text-xs px-3 py-1.5 rounded-lg bg-orange-500 text-white font-semibold disabled:opacity-50 flex items-center gap-1">
                          {reportBusy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Flag className="w-3 h-3" />} জমা
                        </button>
                        <button type="button" onClick={() => setReportId(null)}
                          className="text-xs px-3 py-1.5 rounded-lg bg-muted text-foreground">বাতিল</button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Question text */}
              <div className="text-base font-semibold text-foreground leading-relaxed mb-4">
                <MathText>{q.questionText}</MathText>
              </div>

              {/* Options */}
              <div className="space-y-2 mb-4">
                {q.options.map((opt, i) => (
                  <div key={i} className={cn(
                    "flex items-center gap-3 p-3 rounded-xl border text-sm",
                    revealed && i === q.correctIndex
                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-100 font-medium"
                      : "border-border bg-muted/30 text-muted-foreground"
                  )}>
                    <span className={cn("flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                      revealed && i === q.correctIndex ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground")}>
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
  );
}

// ── Source Insight Card ───────────────────────────────────────────────────────
function SourceInsight({ source }: { source: string }) {
  const { data } = useQuery<InsightRow>({
    queryKey: ["source-insight", source],
    queryFn: () => fetch(apiUrl(`/source-nav/insight?source=${encodeURIComponent(source)}`)).then((r) => r.json()),
  });
  if (!data) return null;
  return (
    <div className="grid grid-cols-3 gap-2 mb-4">
      {[
        { label: "প্রশ্ন", value: data.totalQuestions, icon: <Hash className="w-3.5 h-3.5" /> },
        { label: "বিষয়", value: data.totalSubjects, icon: <Layers className="w-3.5 h-3.5" /> },
        { label: "অধ্যায়", value: data.totalChapters, icon: <BookOpen className="w-3.5 h-3.5" /> },
      ].map(({ label, value, icon }) => (
        <div key={label} className="flex flex-col items-center p-2.5 rounded-xl bg-muted/50 border border-border/50">
          <span className="text-muted-foreground mb-1">{icon}</span>
          <span className="text-base font-bold text-foreground">{value}</span>
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
      ))}
    </div>
  );
}

// ── Shared drill-down shell (source or year) ─────────────────────────────────
type NavItem = { label: string; count?: number };

function DrillShell({
  step, rootLabel, selSource, selSubject, selChapter,
  rootData, rootLoading, subjectData, subjectLoading,
  chapterData, chapterLoading, questionData, questionLoading,
  onSelectRoot, onSelectSubject, onSelectChapter, onBack,
  showInsight,
}: {
  step: DrillStep; rootLabel: string;
  selSource: string | number; selSubject: SubjectRow | null; selChapter: ChapterRow | null;
  rootData: NavItem[]; rootLoading: boolean;
  subjectData: SubjectRow[] | undefined; subjectLoading: boolean;
  chapterData: ChapterRow[] | undefined; chapterLoading: boolean;
  questionData: QuestionRow[] | undefined; questionLoading: boolean;
  onSelectRoot: (key: string | number, label: string) => void;
  onSelectSubject: (s: SubjectRow) => void;
  onSelectChapter: (c: ChapterRow) => void;
  onBack: () => void;
  showInsight?: boolean;
}) {
  const selLabel = String(selSource);

  return (
    <>
      {/* Back + breadcrumb */}
      {step !== "root" && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3 flex-wrap">
          <button type="button" onClick={onBack}
            className="flex items-center gap-1 hover:text-foreground transition-colors -ml-1">
            <ChevronLeft className="w-4 h-4" /> ফিরে যান
          </button>
          <ChevronRight className="w-3 h-3 opacity-50" />
          <span className="text-primary font-medium truncate max-w-[140px]">{selLabel}</span>
          {selSubject && <><ChevronRight className="w-3 h-3 opacity-50" /><span className="text-primary font-medium">{selSubject.subjectName}</span></>}
          {selChapter && <><ChevronRight className="w-3 h-3 opacity-50" /><span className="text-primary font-medium">{selChapter.chapterName}</span></>}
        </div>
      )}

      <AnimatePresence mode="wait">
        {/* Root step */}
        {step === "root" && (
          <motion.div key="root" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
            {rootLoading ? (
              <div className="grid gap-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
            ) : !rootData.length ? (
              <div className="text-center py-16 text-muted-foreground">
                <Database className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>{rootLabel} নেই</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {rootData.map((item) => (
                  <motion.button key={String(item.label)} type="button"
                    whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                    onClick={() => onSelectRoot(item.label, item.label)}
                    className="flex items-center justify-between p-4 rounded-xl border-2 border-border bg-card hover:border-primary/50 hover:bg-muted/50 text-left transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: "var(--qovo-gradient-soft)" }}>
                        <BookOpen className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-semibold text-foreground">{item.label}</div>
                        {item.count !== undefined && <div className="text-xs text-muted-foreground mt-0.5">{item.count}টি প্রশ্ন</div>}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </motion.button>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Subjects */}
        {step === "subjects" && (
          <motion.div key="subjects" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
            {showInsight && <SourceInsight source={selLabel} />}
            {subjectLoading ? (
              <div className="grid gap-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
            ) : (
              <div className="grid gap-3">
                {(subjectData ?? []).map((subj) => (
                  <motion.button key={subj.subjectId} type="button"
                    whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                    onClick={() => onSelectSubject(subj)}
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

        {/* Chapters */}
        {step === "chapters" && (
          <motion.div key="chapters" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
            {chapterLoading ? (
              <div className="grid gap-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
            ) : (
              <div className="grid gap-3">
                {(chapterData ?? []).map((ch, idx) => (
                  <motion.button key={ch.chapterId} type="button"
                    whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                    onClick={() => onSelectChapter(ch)}
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

        {/* Questions */}
        {step === "questions" && (
          <motion.div key="questions" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
            {questionLoading
              ? <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}</div>
              : <QuestionList questions={questionData ?? []} />
            }
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ── Source Tab ────────────────────────────────────────────────────────────────
function SourceTab() {
  const [step,       setStep]       = useState<DrillStep>("root");
  const [selSource,  setSelSource]  = useState("");
  const [selSubject, setSelSubject] = useState<SubjectRow | null>(null);
  const [selChapter, setSelChapter] = useState<ChapterRow | null>(null);

  const { data: sources,   isLoading: loadingSources }   = useQuery<SourceRow[]>({ queryKey: ["src-sources"],   queryFn: () => fetch(apiUrl("/source-nav/sources")).then((r) => r.json()) });
  const { data: subjects,  isLoading: loadingSubjects }  = useQuery<SubjectRow[]>({ queryKey: ["src-subj", selSource],  queryFn: () => fetch(apiUrl(`/source-nav/subjects?source=${encodeURIComponent(selSource)}`)).then((r) => r.json()), enabled: !!selSource });
  const { data: chapters,  isLoading: loadingChapters }  = useQuery<ChapterRow[]>({ queryKey: ["src-ch", selSource, selSubject?.subjectId], queryFn: () => fetch(apiUrl(`/source-nav/chapters?source=${encodeURIComponent(selSource)}&subjectId=${selSubject!.subjectId}`)).then((r) => r.json()), enabled: !!selSource && !!selSubject });
  const { data: questions, isLoading: loadingQuestions } = useQuery<QuestionRow[]>({ queryKey: ["src-q", selSource, selChapter?.chapterId], queryFn: () => fetch(apiUrl(`/source-nav/questions?source=${encodeURIComponent(selSource)}&chapterId=${selChapter!.chapterId}`)).then((r) => r.json()), enabled: !!selSource && !!selChapter });

  const goBack = () => {
    if (step === "questions") { setStep("chapters"); setSelChapter(null); }
    else if (step === "chapters") { setStep("subjects"); setSelSubject(null); }
    else if (step === "subjects") { setStep("root"); setSelSource(""); }
  };

  return (
    <DrillShell
      step={step} rootLabel="কোনো উৎস"
      selSource={selSource} selSubject={selSubject} selChapter={selChapter}
      rootData={(sources ?? []).map((s) => ({ label: s.source, count: s.count }))}
      rootLoading={loadingSources}
      subjectData={subjects} subjectLoading={loadingSubjects}
      chapterData={chapters} chapterLoading={loadingChapters}
      questionData={questions} questionLoading={loadingQuestions}
      onSelectRoot={(key) => { setSelSource(String(key)); setStep("subjects"); }}
      onSelectSubject={(s) => { setSelSubject(s); setStep("chapters"); }}
      onSelectChapter={(c) => { setSelChapter(c); setStep("questions"); }}
      onBack={goBack}
      showInsight={step === "subjects"}
    />
  );
}

// ── Year Tab ──────────────────────────────────────────────────────────────────
function YearTab() {
  const [step,       setStep]       = useState<DrillStep>("root");
  const [selYear,    setSelYear]    = useState(0);
  const [selSubject, setSelSubject] = useState<SubjectRow | null>(null);
  const [selChapter, setSelChapter] = useState<ChapterRow | null>(null);

  const { data: years,     isLoading: loadingYears }     = useQuery<YearRow[]>({ queryKey: ["yr-years"],  queryFn: () => fetch(apiUrl("/source-nav/years")).then((r) => r.json()) });
  const { data: subjects,  isLoading: loadingSubjects }  = useQuery<SubjectRow[]>({ queryKey: ["yr-subj", selYear],  queryFn: () => fetch(apiUrl(`/source-nav/year-subjects?year=${selYear}`)).then((r) => r.json()), enabled: !!selYear });
  const { data: chapters,  isLoading: loadingChapters }  = useQuery<ChapterRow[]>({ queryKey: ["yr-ch", selYear, selSubject?.subjectId],  queryFn: () => fetch(apiUrl(`/source-nav/year-chapters?year=${selYear}&subjectId=${selSubject!.subjectId}`)).then((r) => r.json()), enabled: !!selYear && !!selSubject });
  const { data: questions, isLoading: loadingQuestions } = useQuery<QuestionRow[]>({ queryKey: ["yr-q", selYear, selChapter?.chapterId],  queryFn: () => fetch(apiUrl(`/source-nav/year-questions?year=${selYear}&chapterId=${selChapter!.chapterId}`)).then((r) => r.json()), enabled: !!selYear && !!selChapter });

  const goBack = () => {
    if (step === "questions") { setStep("chapters"); setSelChapter(null); }
    else if (step === "chapters") { setStep("subjects"); setSelSubject(null); }
    else if (step === "subjects") { setStep("root"); setSelYear(0); }
  };

  return (
    <DrillShell
      step={step} rootLabel="কোনো বছর"
      selSource={selYear || ""} selSubject={selSubject} selChapter={selChapter}
      rootData={(years ?? []).map((y) => ({ label: String(y.year), count: y.count }))}
      rootLoading={loadingYears}
      subjectData={subjects} subjectLoading={loadingSubjects}
      chapterData={chapters} chapterLoading={loadingChapters}
      questionData={questions} questionLoading={loadingQuestions}
      onSelectRoot={(key) => { setSelYear(Number(key)); setStep("subjects"); }}
      onSelectSubject={(s) => { setSelSubject(s); setStep("chapters"); }}
      onSelectChapter={(c) => { setSelChapter(c); setStep("questions"); }}
      onBack={goBack}
      showInsight={false}
    />
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function SourcePage() {
  const [mainTab, setMainTab] = useState<MainTab>("source");

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: "var(--qovo-gradient)" }}>
          <Database className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">উৎস অনুযায়ী প্রশ্ন</h1>
          <p className="text-xs text-muted-foreground">প্রশ্নের উৎস ও সাল অনুযায়ী ব্রাউজ করুন</p>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 p-1 rounded-2xl bg-muted mb-5">
        <button type="button" onClick={() => setMainTab("source")}
          className={cn("flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold transition-all",
            mainTab === "source" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
          <BarChart3 className="w-4 h-4" /> উৎস অনুযায়ী
        </button>
        <button type="button" onClick={() => setMainTab("year")}
          className={cn("flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold transition-all",
            mainTab === "year" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
          <Calendar className="w-4 h-4" /> সাল অনুযায়ী
        </button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={mainTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
          {mainTab === "source" && <SourceTab />}
          {mainTab === "year"   && <YearTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
