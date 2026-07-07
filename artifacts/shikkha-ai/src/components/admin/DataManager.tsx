import { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trash2, Pencil, Search, Loader2, BookOpen, FolderOpen, FileQuestion,
  ChevronDown, ChevronUp, AlertTriangle, X, Check,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { MathText } from "@/components/MathText";
import { useToast } from "@/hooks/use-toast";

function adminToken() { try { return sessionStorage.getItem("qovo-admin-token") ?? ""; } catch { return ""; } }
function adminHdr() { return { "x-admin-token": adminToken() }; }

function diffLabel(d: string) {
  return d === "easy" ? "সহজ" : d === "medium" ? "মাঝারি" : "কঠিন";
}
function diffColor(d: string) {
  return d === "easy"
    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
    : d === "medium"
    ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
    : "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300";
}

type Subject = { id: number; nameBn: string; color: string };
type Chapter = { id: number; subjectId: number; nameBn: string; orderIndex: number };
type Question = {
  id: number; questionText: string; options: string[];
  correctIndex: number; explanation: string; difficulty: string;
  source: string | null; year: number | null; chapterId: number;
  chapterName: string; subjectName: string;
};

/* ── Glassmorphism Confirmation Modal ─────────────────────────────────────── */
function ConfirmModal({
  open, title, message, dangerText, onConfirm, onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  dangerText: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-sm rounded-2xl border border-white/20 bg-white/80 dark:bg-black/70 backdrop-blur-xl shadow-2xl p-5 space-y-4"
      >
        <div className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="w-5 h-5" />
          <h3 className="font-bold text-base">{title}</h3>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">{message}</p>
        <div className="flex gap-2.5 pt-1">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-border bg-muted hover:bg-muted/80 transition-colors">
            বাতিল
          </button>
          <button onClick={onConfirm} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-destructive text-white hover:bg-destructive/90 transition-colors">
            {dangerText}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ── MCQ Edit Modal ───────────────────────────────────────────────────────── */
function EditQuestionModal({
  open, question, chapters, onClose, onSave,
}: {
  open: boolean;
  question: Question | null;
  chapters: Chapter[];
  onClose: () => void;
  onSave: (id: number, body: Record<string, unknown>) => void;
}) {
  if (!open || !question) return null;
  const [text, setText] = useState(question.questionText);
  const [opts, setOpts]   = useState<string[]>([...question.options]);
  const [correct, setCorrect] = useState(question.correctIndex);
  const [explain, setExplain] = useState(question.explanation);
  const [diff, setDiff] = useState(question.difficulty);
  const [source, setSource] = useState(question.source ?? "");
  const [year, setYear] = useState(question.year?.toString() ?? "");
  const [chapterId, setChapterId] = useState(question.chapterId);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    onSave(question.id, {
      questionText: text,
      options: opts,
      correctIndex: correct,
      explanation: explain,
      difficulty: diff,
      source: source || null,
      year: year ? Number(year) : null,
      chapterId,
    });
    setBusy(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl border border-white/20 bg-white/85 dark:bg-black/70 backdrop-blur-xl shadow-2xl p-5 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base">MCQ সম্পাদনা</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">প্রশ্ন</label>
            <textarea value={text} onChange={(e) => setText(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            {opts.map((o, i) => (
              <div key={i} className="flex items-center gap-2">
                <input type="radio" name="correct" checked={correct === i} onChange={() => setCorrect(i)} className="accent-primary" />
                <input value={o} onChange={(e) => {
                  const n = [...opts]; n[i] = e.target.value; setOpts(n);
                }} className="flex-1 px-2.5 py-1.5 rounded-lg border border-border bg-card text-sm focus:outline-none" />
              </div>
            ))}
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">ব্যাখ্যা</label>
            <textarea value={explain} onChange={(e) => setExplain(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <select value={diff} onChange={(e) => setDiff(e.target.value)}
              className="px-3 py-2 rounded-xl border border-border bg-card text-sm focus:outline-none">
              <option value="easy">সহজ</option>
              <option value="medium">মাঝারি</option>
              <option value="hard">কঠিন</option>
            </select>
            <select value={chapterId} onChange={(e) => setChapterId(Number(e.target.value))}
              className="px-3 py-2 rounded-xl border border-border bg-card text-sm focus:outline-none">
              {chapters.map((c) => (
                <option key={c.id} value={c.id}>{c.nameBn}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <input value={source} onChange={(e) => setSource(e.target.value)} placeholder="উৎস"
              className="px-3 py-2 rounded-xl border border-border bg-card text-sm focus:outline-none" />
            <input value={year} onChange={(e) => setYear(e.target.value)} type="number" placeholder="বছর"
              className="px-3 py-2 rounded-xl border border-border bg-card text-sm focus:outline-none" />
          </div>
        </div>

        <div className="flex gap-2.5 pt-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-border bg-muted hover:bg-muted/80 transition-colors">
            বাতিল
          </button>
          <button onClick={save} disabled={busy}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-60"
            style={{ background: "var(--qovo-gradient)" }}>
            {busy ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "সেভ করুন"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ── Manage Tab ────────────────────────────────────────────────────────────── */
export default function DataManager() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [section, setSection] = useState<"subjects" | "chapters" | "mcqs">("subjects");

  /* Subjects */
  const { data: subjects, isLoading: subLoading } = useQuery<Subject[]>({
    queryKey: ["/api/subjects"],
    queryFn: () => fetch("/api/subjects").then((r) => r.json()),
  });
  const [editingSub, setEditingSub] = useState<number | null>(null);
  const [editSubName, setEditSubName] = useState("");

  const [confirmDelSub, setConfirmDelSub] = useState<number | null>(null);

  const saveSubject = async (id: number) => {
    const name = editSubName.trim();
    if (!name) return;
    const res = await fetch(`/api/subjects/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json", ...adminHdr() },
      body: JSON.stringify({ nameBn: name }),
    });
    if (res.ok) {
      toast({ title: "বিষয় আপডেট হয়েছে", description: `"${name}" সফলভাবে সংরক্ষিত।` });
      qc.invalidateQueries({ queryKey: ["/api/subjects"] });
      setEditingSub(null);
    } else {
      toast({ title: "ত্রুটি", description: "বিষয় আপডেট ব্যর্থ হয়েছে।", variant: "destructive" });
    }
  };

  const deleteSubject = async (id: number) => {
    const res = await fetch(`/api/subjects/${id}`, { method: "DELETE", headers: adminHdr() });
    if (res.ok) {
      const j = await res.json().catch(() => ({} as { chaptersDeleted?: number; questionsDeleted?: number }));
      toast({
        title: "বিষয় মুছে ফেলা হয়েছে",
        description: `${j.chaptersDeleted ?? 0}টি অধ্যায় ও ${j.questionsDeleted ?? 0}টি প্রশ্নসহ বিষয় স্থায়ীভাবে মুছে ফেলা হয়েছে।`,
        variant: "destructive",
      });
      qc.invalidateQueries({ queryKey: ["/api/subjects"] });
      qc.invalidateQueries({ queryKey: ["all-chapters"] });
      qc.invalidateQueries({ queryKey: ["/api/chapters"] });
    } else {
      toast({ title: "ত্রুটি", description: "বিষয় মুছতে ব্যর্থ হয়েছে।", variant: "destructive" });
    }
    setConfirmDelSub(null);
  };

  /* Chapters */
  const { data: allChapters, isLoading: chapLoading } = useQuery<Chapter[]>({
    queryKey: ["all-chapters"],
    queryFn: () => fetch("/api/chapters").then((r) => r.json()).catch(() => []),
    enabled: section === "chapters",
  });
  const [editingChap, setEditingChap] = useState<number | null>(null);
  const [editChapName, setEditChapName] = useState("");
  const [confirmDelChap, setConfirmDelChap] = useState<number | null>(null);
  const [chapOpen, setChapOpen] = useState<Record<number, boolean>>({});

  const saveChapter = async (id: number) => {
    const name = editChapName.trim();
    if (!name) return;
    const res = await fetch(`/api/chapters/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json", ...adminHdr() },
      body: JSON.stringify({ nameBn: name }),
    });
    if (res.ok) {
      toast({ title: "অধ্যায় আপডেট হয়েছে", description: `"${name}" সফলভাবে সংরক্ষিত।` });
      qc.invalidateQueries({ queryKey: ["all-chapters"] });
      qc.invalidateQueries({ queryKey: ["/api/subjects"] });
      setEditingChap(null);
    } else {
      toast({ title: "ত্রুটি", description: "অধ্যায় আপডেট ব্যর্থ হয়েছে।", variant: "destructive" });
    }
  };

  const deleteChapter = async (id: number) => {
    const res = await fetch(`/api/chapters/${id}`, { method: "DELETE", headers: adminHdr() });
    if (res.ok) {
      const j = await res.json().catch(() => ({} as { questionsDeleted?: number }));
      toast({
        title: "অধ্যায় মুছে ফেলা হয়েছে",
        description: `${j.questionsDeleted ?? 0}টি প্রশ্নসহ অধ্যায় মুছে ফেলা হয়েছে।`,
        variant: "destructive",
      });
      qc.invalidateQueries({ queryKey: ["all-chapters"] });
      qc.invalidateQueries({ queryKey: ["/api/subjects"] });
      qc.invalidateQueries({ queryKey: ["/api/chapters"] });
    } else {
      toast({ title: "ত্রুটি", description: "অধ্যায় মুছতে ব্যর্থ হয়েছে।", variant: "destructive" });
    }
    setConfirmDelChap(null);
  };

  /* MCQs */
  const [mcqKeyword, setMcqKeyword] = useState("");
  const [mcqSubject, setMcqSubject] = useState("");
  const [mcqSearched, setMcqSearched] = useState(false);
  const [mcqLoading, setMcqLoading] = useState(false);
  const [mcqResults, setMcqResults] = useState<Question[]>([]);
  const [confirmDelQ, setConfirmDelQ] = useState<number | null>(null);
  const [editQ, setEditQ] = useState<Question | null>(null);
  const [editQOpen, setEditQOpen] = useState(false);

  const doSearchMCQ = useCallback(async () => {
    setMcqLoading(true);
    setMcqSearched(true);
    const p = new URLSearchParams();
    if (mcqKeyword) p.set("keyword", mcqKeyword);
    if (mcqSubject) p.set("subjectId", mcqSubject);
    try {
      const rows = await fetch(`/api/admin/search?${p}`).then((r) => r.json());
      setMcqResults(rows ?? []);
    } catch { setMcqResults([]); }
    setMcqLoading(false);
  }, [mcqKeyword, mcqSubject]);

  const saveQuestion = async (id: number, body: Record<string, unknown>) => {
    const res = await fetch(`/api/questions/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json", ...adminHdr() },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      toast({ title: "MCQ আপডেট হয়েছে", description: "প্রশ্ন সফলভাবে সংরক্ষিত।" });
      setEditQOpen(false);
      setEditQ(null);
      doSearchMCQ();
      qc.invalidateQueries({ queryKey: ["/api/chapters"] });
      qc.invalidateQueries({ queryKey: ["/api/subjects"] });
    } else {
      toast({ title: "ত্রুটি", description: "MCQ আপডেট ব্যর্থ হয়েছে।", variant: "destructive" });
    }
  };

  const deleteQuestion = async (id: number) => {
    const res = await fetch(`/api/questions/${id}`, { method: "DELETE", headers: adminHdr() });
    if (res.ok) {
      toast({ title: "MCQ মুছে ফেলা হয়েছে", description: "প্রশ্ন স্থায়ীভাবে মুছে ফেলা হয়েছে।", variant: "destructive" });
      setMcqResults((prev) => prev.filter((q) => q.id !== id));
    } else {
      toast({ title: "ত্রুটি", description: "মুছতে ব্যর্থ হয়েছে।", variant: "destructive" });
    }
    setConfirmDelQ(null);
  };

  const sections = [
    { id: "subjects" as const, label: "বিষয়", icon: <BookOpen className="w-4 h-4" /> },
    { id: "chapters" as const, label: "অধ্যায়", icon: <FolderOpen className="w-4 h-4" /> },
    { id: "mcqs" as const, label: "MCQ", icon: <FileQuestion className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-5">
      {/* Section tabs */}
      <div className="flex gap-1 p-1 rounded-2xl bg-muted">
        {sections.map((s) => (
          <button key={s.id} type="button" onClick={() => setSection(s.id)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold transition-all",
              section === s.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}>
            {s.icon} {s.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={section} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>

          {/* ── Subjects ─────────────────────────────────────────────── */}
          {section === "subjects" && (
            <div className="space-y-2">
              {subLoading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)
                : (subjects ?? []).map((s) => (
                  <div key={s.id} className="flex items-center gap-3 p-3.5 rounded-xl border border-border bg-card">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: s.color }} />
                    {editingSub === s.id ? (
                      <>
                        <input autoFocus value={editSubName} onChange={(e) => setEditSubName(e.target.value)}
                          className="flex-1 px-3 py-1.5 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                        <button onClick={() => saveSubject(s.id)} className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20">
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setEditingSub(null)} className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/80">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="flex-1 text-sm font-medium">{s.nameBn}</span>
                        <button onClick={() => { setEditingSub(s.id); setEditSubName(s.nameBn); }}
                          className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setConfirmDelSub(s.id)}
                          className="w-7 h-7 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center hover:bg-destructive/20 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                ))}
            </div>
          )}

          {/* ── Chapters ─────────────────────────────────────────────── */}
          {section === "chapters" && (
            <div className="space-y-3">
              {chapLoading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)
                : (subjects ?? []).map((sub) => {
                  const chaps = (allChapters ?? []).filter((c) => c.subjectId === sub.id);
                  const open = !!chapOpen[sub.id];
                  return (
                    <div key={sub.id} className="rounded-xl border border-border bg-card overflow-hidden">
                      <button onClick={() => setChapOpen((p) => ({ ...p, [sub.id]: !p[sub.id] }))}
                        className="w-full flex items-center gap-2 px-4 py-3 text-sm font-semibold hover:bg-muted/40 transition-colors">
                        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: sub.color }} />
                        {sub.nameBn} <span className="text-xs text-muted-foreground font-normal">({chaps.length}টি)</span>
                      </button>
                      <AnimatePresence>
                        {open && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                            <div className="px-4 pb-3 space-y-1.5">
                              {chaps.map((c) => (
                                <div key={c.id} className="flex items-center gap-2 py-1.5">
                                  {editingChap === c.id ? (
                                    <>
                                      <input autoFocus value={editChapName} onChange={(e) => setEditChapName(e.target.value)}
                                        className="flex-1 px-2.5 py-1 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                                      <button onClick={() => saveChapter(c.id)} className="w-6 h-6 rounded-md bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20">
                                        <Check className="w-3 h-3" />
                                      </button>
                                      <button onClick={() => setEditingChap(null)} className="w-6 h-6 rounded-md bg-muted flex items-center justify-center hover:bg-muted/80">
                                        <X className="w-3 h-3" />
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <span className="flex-1 text-sm">{c.nameBn}</span>
                                      <button onClick={() => { setEditingChap(c.id); setEditChapName(c.nameBn); }}
                                        className="w-6 h-6 rounded-md bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors">
                                        <Pencil className="w-3 h-3" />
                                      </button>
                                      <button onClick={() => setConfirmDelChap(c.id)}
                                        className="w-6 h-6 rounded-md bg-destructive/10 text-destructive flex items-center justify-center hover:bg-destructive/20 transition-colors">
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </>
                                  )}
                                </div>
                              ))}
                              {chaps.length === 0 && <p className="text-xs text-muted-foreground py-1">কোনো অধ্যায় নেই</p>}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
            </div>
          )}

          {/* ── MCQs ───────────────────────────────────────────────────── */}
          {section === "mcqs" && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <input value={mcqKeyword} onChange={(e) => setMcqKeyword(e.target.value)}
                  placeholder="কীওয়ার্ড খুঁজুন..."
                  onKeyDown={(e) => e.key === "Enter" && doSearchMCQ()}
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                <select value={mcqSubject} onChange={(e) => setMcqSubject(e.target.value)}
                  className="px-3 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none">
                  <option value="">সব বিষয়</option>
                  {(subjects ?? []).map((s) => <option key={s.id} value={s.id}>{s.nameBn}</option>)}
                </select>
                <button onClick={doSearchMCQ} disabled={mcqLoading}
                  className="px-4 py-2.5 rounded-xl font-semibold text-white text-sm disabled:opacity-60"
                  style={{ background: "var(--qovo-gradient)" }}>
                  {mcqLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </button>
              </div>

              {mcqSearched && !mcqLoading && (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">{mcqResults.length}টি ফলাফল</p>
                  {mcqResults.map((q) => (
                    <div key={q.id} className="flex items-start gap-3 p-4 rounded-xl border border-border bg-card">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-xs font-mono text-muted-foreground opacity-60">#{q.id}</span>
                          <span className={cn("text-xs px-1.5 py-0.5 rounded-full font-medium", diffColor(q.difficulty))}>{diffLabel(q.difficulty)}</span>
                          <span className="text-xs text-muted-foreground">{q.subjectName} &rsaquo; {q.chapterName}</span>
                        </div>
                        <p className="text-sm text-foreground leading-snug line-clamp-2">
                          <MathText>{q.questionText}</MathText>
                        </p>
                      </div>
                      <div className="flex-shrink-0 flex items-center gap-1.5">
                        <button onClick={() => { setEditQ(q); setEditQOpen(true); }}
                          className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-colors">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setConfirmDelQ(q.id)}
                          className="w-7 h-7 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center hover:bg-destructive/20 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {mcqResults.length === 0 && (
                    <div className="text-center py-10 text-muted-foreground text-sm">কোনো ফলাফল পাওয়া যায়নি</div>
                  )}
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Confirm modals */}
      <ConfirmModal
        open={!!confirmDelSub}
        title="সতর্কতা: বিষয় মুছুন"
        message="এই বিষয় মুছে ফেললে এর সকল অধ্যায় এবং সকল MCQ স্থায়ীভাবে মুছে যাবে। এই কাজ ফেরত নেওয়া যাবে না।"
        dangerText="স্থায়ীভাবে মুছুন"
        onConfirm={() => confirmDelSub && deleteSubject(confirmDelSub)}
        onCancel={() => setConfirmDelSub(null)}
      />
      <ConfirmModal
        open={!!confirmDelChap}
        title="সতর্কতা: অধ্যায় মুছুন"
        message="এই অধ্যায় মুছে ফেললে এর সকল MCQ স্থায়ীভাবে মুছে যাবে। এই কাজ ফেরত নেওয়া যাবে না।"
        dangerText="স্থায়ীভাবে মুছুন"
        onConfirm={() => confirmDelChap && deleteChapter(confirmDelChap)}
        onCancel={() => setConfirmDelChap(null)}
      />
      <ConfirmModal
        open={!!confirmDelQ}
        title="MCQ মুছুন"
        message="আপনি কি এই প্রশ্ন স্থায়ীভাবে মুছে ফেলতে চান? এই কাজ ফেরত নেওয়া যাবে না।"
        dangerText="মুছুন"
        onConfirm={() => confirmDelQ && deleteQuestion(confirmDelQ)}
        onCancel={() => setConfirmDelQ(null)}
      />
      <EditQuestionModal
        open={editQOpen}
        question={editQ}
        chapters={allChapters ?? []}
        onClose={() => { setEditQOpen(false); setEditQ(null); }}
        onSave={saveQuestion}
      />
    </div>
  );
}
