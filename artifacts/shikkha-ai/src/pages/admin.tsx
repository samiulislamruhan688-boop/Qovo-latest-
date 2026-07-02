import { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trash2, RotateCcw, Search, ShieldCheck,
  X, Check, Loader2, Flag,
  Database,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { MathText } from "@/components/MathText";

type SubjectOption = { id: number; nameBn: string };

type Tab = "trash" | "search" | "reports";

type TrashItem = {
  id: number; questionText: string; options: string[];
  correctIndex: number; difficulty: string; source: string | null;
  year: number | null; deletedAt: string;
  chapterName: string; subjectName: string; subjectColor: string;
};

type SearchResult = {
  id: number; questionText: string; options: string[];
  correctIndex: number; explanation: string; difficulty: string;
  source: string | null; year: number | null; hint: string | null;
  chapterName: string; subjectName: string; subjectColor: string;
};

type ReportItem = {
  id: number; questionId: number; reason: string; details: string | null;
  createdAt: string; questionText: string; chapterName: string; subjectName: string;
};

const REASONS = [
  "ভুল উত্তর",
  "ভুল LaTeX/সূত্র",
  "বানান/ব্যাকরণ ভুল",
  "অপূর্ণ প্রশ্ন",
  "ডুপ্লিকেট প্রশ্ন",
  "ভুল ব্যাখ্যা",
  "অন্যান্য",
];

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

function adminToken() { try { return sessionStorage.getItem("qovo-admin-token") ?? ""; } catch { return ""; } }
function adminHdr() { return { "x-admin-token": adminToken() }; }

// ── Trash Tab ─────────────────────────────────────────────────────────────────
function TrashTab() {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [confirmPerm, setConfirmPerm] = useState<number | null>(null);

  const { data, isLoading } = useQuery<TrashItem[]>({
    queryKey: ["admin-trash"],
    queryFn: () => fetch("/api/admin/trash").then((r) => r.json()),
  });

  const restore = async (id: number) => {
    await fetch(`/api/questions/${id}/restore`, { method: "PATCH", headers: adminHdr() });
    qc.invalidateQueries({ queryKey: ["admin-trash"] });
    setSelected((p) => { const n = new Set(p); n.delete(id); return n; });
  };

  const permDelete = async (id: number) => {
    await fetch(`/api/questions/${id}/permanent`, { method: "DELETE", headers: adminHdr() });
    qc.invalidateQueries({ queryKey: ["admin-trash"] });
    setConfirmPerm(null);
    setSelected((p) => { const n = new Set(p); n.delete(id); return n; });
  };

  const bulkRestore = async () => {
    const ids = Array.from(selected);
    await fetch("/api/questions/bulk-restore", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...adminHdr() },
      body: JSON.stringify({ ids }),
    });
    qc.invalidateQueries({ queryKey: ["admin-trash"] });
    setSelected(new Set());
  };

  const bulkDelete = async () => {
    const ids = Array.from(selected);
    await Promise.all(ids.map((id) => fetch(`/api/questions/${id}/permanent`, { method: "DELETE", headers: adminHdr() })));
    qc.invalidateQueries({ queryKey: ["admin-trash"] });
    setSelected(new Set());
  };

  const toggleSelect = (id: number) =>
    setSelected((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const toggleAll = () =>
    setSelected(selected.size === (data?.length ?? 0) ? new Set() : new Set(data?.map((q) => q.id)));

  if (isLoading) return <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>;

  if (!data?.length) return (
    <div className="text-center py-16 text-muted-foreground">
      <Trash2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
      <p className="font-medium">ট্র্যাশ খালি</p>
      <p className="text-xs mt-1">মুছে দেওয়া প্রশ্নগুলো এখানে দেখা যাবে</p>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Bulk actions */}
      <div className="flex items-center gap-3 flex-wrap">
        <button type="button" onClick={toggleAll}
          className="text-xs px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted transition-colors flex items-center gap-1.5">
          <div className={cn("w-3.5 h-3.5 rounded border-2 flex items-center justify-center", selected.size === data.length ? "bg-primary border-primary" : "border-muted-foreground/40")}>
            {selected.size === data.length && <Check className="w-2.5 h-2.5 text-white" />}
          </div>
          সব ({data.length})
        </button>
        {selected.size > 0 && (
          <>
            <button type="button" onClick={bulkRestore}
              className="text-xs px-3 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 transition-colors flex items-center gap-1.5">
              <RotateCcw className="w-3.5 h-3.5" /> {selected.size}টি রিস্টোর
            </button>
            <button type="button" onClick={bulkDelete}
              className="text-xs px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive border border-destructive/30 hover:bg-destructive/20 transition-colors flex items-center gap-1.5">
              <Trash2 className="w-3.5 h-3.5" /> {selected.size}টি স্থায়ীভাবে মুছুন
            </button>
          </>
        )}
        <div className="ml-auto text-xs text-muted-foreground">{data.length}টি প্রশ্ন</div>
      </div>

      {/* Items */}
      {data.map((item) => {
        const daysLeft = Math.max(0, 30 - Math.floor((Date.now() - new Date(item.deletedAt).getTime()) / 86400000));
        return (
          <div key={item.id} className={cn(
            "flex items-start gap-3 p-4 rounded-xl border transition-colors",
            selected.has(item.id) ? "border-primary/40 bg-primary/5" : "border-border bg-card",
          )}>
            <button type="button" onClick={() => toggleSelect(item.id)}
              className={cn("flex-shrink-0 mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center transition-colors",
                selected.has(item.id) ? "bg-primary border-primary" : "border-muted-foreground/40 hover:border-primary/60")}>
              {selected.has(item.id) && <Check className="w-2.5 h-2.5 text-white" />}
            </button>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-xs font-mono text-muted-foreground opacity-60">#{item.id}</span>
                <span className={cn("text-xs px-1.5 py-0.5 rounded-full font-medium", diffColor(item.difficulty))}>{diffLabel(item.difficulty)}</span>
                <span className="text-xs text-muted-foreground">{item.subjectName} › {item.chapterName}</span>
                {daysLeft <= 7 && <span className="text-xs text-destructive font-medium">{daysLeft} দিন বাকি</span>}
              </div>
              <p className="text-sm text-foreground leading-snug line-clamp-2">
                <MathText>{item.questionText}</MathText>
              </p>
            </div>

            <div className="flex-shrink-0 flex items-center gap-1.5">
              <button type="button" onClick={() => restore(item.id)}
                className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                <RotateCcw className="w-3 h-3" /> রিস্টোর
              </button>
              {confirmPerm === item.id ? (
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => permDelete(item.id)}
                    className="text-xs px-2 py-1 rounded-lg bg-destructive text-white font-semibold">হ্যাঁ</button>
                  <button type="button" onClick={() => setConfirmPerm(null)}
                    className="text-xs px-2 py-1 rounded-lg bg-muted">না</button>
                </div>
              ) : (
                <button type="button" onClick={() => setConfirmPerm(item.id)}
                  className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors">
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Search Tab ────────────────────────────────────────────────────────────────
function SearchTab() {
  const qc = useQueryClient();
  const [keyword,    setKeyword]    = useState("");
  const [subjectId,  setSubjectId]  = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [year,       setYear]       = useState("");
  const [source,     setSource]     = useState("");
  const [searched,   setSearched]   = useState(false);
  const [trashConfirm, setTrashConfirm] = useState<number | null>(null);
  const [trashedIds, setTrashedIds] = useState<Set<number>>(new Set());

  const { data: subjects } = useQuery<SubjectOption[]>({ queryKey: ["/api/subjects"], queryFn: () => fetch("/api/subjects").then((r) => r.json()) });

  const params = new URLSearchParams();
  if (keyword)    params.set("keyword",    keyword);
  if (subjectId)  params.set("subjectId",  subjectId);
  if (difficulty) params.set("difficulty", difficulty);
  if (year)       params.set("year",       year);
  if (source)     params.set("source",     source);

  const { data: results, isLoading, refetch } = useQuery<SearchResult[]>({
    queryKey: ["admin-search", keyword, subjectId, difficulty, year, source],
    queryFn: () => fetch(`/api/admin/search?${params}`).then((r) => r.json()),
    enabled: false,
  });

  const doSearch = useCallback(() => { setSearched(true); refetch(); }, [refetch]);

  const handleTrash = async (id: number) => {
    await fetch(`/api/questions/${id}/trash`, { method: "PATCH", headers: adminHdr() });
    setTrashedIds((p) => new Set([...p, id]));
    setTrashConfirm(null);
    qc.invalidateQueries({ queryKey: ["admin-trash"] });
  };

  const visible = (results ?? []).filter((q) => !trashedIds.has(q.id));

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="grid grid-cols-2 gap-2.5">
        <input value={keyword} onChange={(e) => setKeyword(e.target.value)}
          placeholder="কীওয়ার্ড খুঁজুন..."
          onKeyDown={(e) => e.key === "Enter" && doSearch()}
          className="col-span-2 px-3.5 py-2.5 rounded-xl border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />

        <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)}
          className="px-3.5 py-2.5 rounded-xl border border-border bg-card text-sm text-foreground focus:outline-none">
          <option value="">সব বিষয়</option>
          {(subjects ?? []).map((s) => <option key={s.id} value={s.id}>{s.nameBn}</option>)}
        </select>

        <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}
          className="px-3.5 py-2.5 rounded-xl border border-border bg-card text-sm text-foreground focus:outline-none">
          <option value="">সব কঠিনতা</option>
          <option value="easy">সহজ</option>
          <option value="medium">মাঝারি</option>
          <option value="hard">কঠিন</option>
        </select>

        <input value={year} onChange={(e) => setYear(e.target.value)} type="number" placeholder="বছর (যেমন: 2023)"
          className="px-3.5 py-2.5 rounded-xl border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none" />

        <input value={source} onChange={(e) => setSource(e.target.value)} placeholder="উৎস"
          className="px-3.5 py-2.5 rounded-xl border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none" />
      </div>

      <button type="button" onClick={doSearch} disabled={isLoading}
        className="w-full py-2.5 rounded-xl font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60"
        style={{ background: "var(--qovo-gradient)" }}>
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
        {isLoading ? "খোঁজা হচ্ছে..." : "অনুসন্ধান করুন"}
      </button>

      {/* Results */}
      {searched && !isLoading && (
        <div>
          <p className="text-xs text-muted-foreground mb-3">{visible.length}টি ফলাফল</p>
          <div className="space-y-3">
            {visible.map((q) => (
              <div key={q.id} className="flex items-start gap-3 p-4 rounded-xl border border-border bg-card">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-xs font-mono text-muted-foreground opacity-60">#{q.id}</span>
                    <span className={cn("text-xs px-1.5 py-0.5 rounded-full font-medium", diffColor(q.difficulty))}>{diffLabel(q.difficulty)}</span>
                    <span className="text-xs text-muted-foreground">{q.subjectName} › {q.chapterName}</span>
                    {q.year && <span className="text-xs text-muted-foreground">{q.year}</span>}
                  </div>
                  <p className="text-sm text-foreground leading-snug line-clamp-2">
                    <MathText>{q.questionText}</MathText>
                  </p>
                </div>
                <div className="flex-shrink-0 flex items-center gap-1.5">
                  {trashConfirm === q.id ? (
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => handleTrash(q.id)}
                        className="text-xs px-2 py-1 rounded-lg bg-destructive text-white font-semibold">হ্যাঁ</button>
                      <button type="button" onClick={() => setTrashConfirm(null)}
                        className="text-xs px-2 py-1 rounded-lg bg-muted">না</button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => setTrashConfirm(q.id)}
                      className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors">
                      <Trash2 className="w-3 h-3" /> ট্র্যাশ
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Reports Tab ───────────────────────────────────────────────────────────────
function ReportsTab() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery<ReportItem[]>({
    queryKey: ["admin-reports"],
    queryFn: () => fetch("/api/admin/reports").then((r) => r.json()),
  });

  const dismiss = async (id: number) => {
    await fetch(`/api/admin/reports/${id}`, { method: "DELETE", headers: adminHdr() }).catch(() => {});
    qc.invalidateQueries({ queryKey: ["admin-reports"] });
  };

  if (isLoading) return <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>;

  if (!data?.length) return (
    <div className="text-center py-16 text-muted-foreground">
      <Flag className="w-12 h-12 mx-auto mb-3 opacity-30" />
      <p className="font-medium">কোনো রিপোর্ট নেই</p>
      <p className="text-xs mt-1">প্রশ্ন অনুশীলনের সময় সমস্যা রিপোর্ট হলে এখানে দেখা যাবে</p>
    </div>
  );

  return (
    <div className="space-y-3">
      {data.map((r) => (
        <div key={r.id} className="flex items-start gap-3 p-4 rounded-xl border border-border bg-card">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-xs font-semibold text-destructive px-2 py-0.5 rounded-full bg-destructive/10">
                {r.reason}
              </span>
              <span className="text-xs text-muted-foreground">{r.subjectName} › {r.chapterName}</span>
              <span className="text-xs text-muted-foreground font-mono opacity-60">#{r.questionId}</span>
              <span className="text-xs text-muted-foreground ml-auto">
                {new Date(r.createdAt).toLocaleDateString("bn-BD")}
              </span>
            </div>
            <p className="text-sm text-foreground line-clamp-1 mb-1">
              <MathText>{r.questionText}</MathText>
            </p>
            {r.details && <p className="text-xs text-muted-foreground italic">{r.details}</p>}
          </div>
          <button type="button" onClick={() => dismiss(r.id)}
            className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}

// ── Main Admin Page ───────────────────────────────────────────────────────────
export default function AdminPage() {
  const adminMode = (() => { try { return !!sessionStorage.getItem("qovo-admin-token"); } catch { return false; } })();
  const [tab, setTab] = useState<Tab>("trash");

  if (!adminMode) return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <ShieldCheck className="w-16 h-16 text-muted-foreground/30 mb-4" />
      <h2 className="text-lg font-bold text-foreground mb-2">অ্যাডমিন অ্যাক্সেস প্রয়োজন</h2>
      <p className="text-sm text-muted-foreground max-w-xs">
        প্রোফাইল পেজে গিয়ে অ্যাডমিন মোড চালু করুন।
      </p>
    </div>
  );

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "trash",   label: "ট্র্যাশ",      icon: <Trash2 className="w-4 h-4" /> },
    { id: "search",  label: "অনুসন্ধান",    icon: <Search className="w-4 h-4" /> },
    { id: "reports", label: "রিপোর্ট",       icon: <Flag className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
          style={{ background: "var(--qovo-gradient)" }}>
          <Database className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">অ্যাডমিন প্যানেল</h1>
          <p className="text-xs text-muted-foreground">প্রশ্ন ব্যবস্থাপনা ও ট্র্যাশ</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-2xl bg-muted mb-5">
        {tabs.map((t) => (
          <button key={t.id} type="button" onClick={() => setTab(t.id)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold transition-all",
              tab === t.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
          {tab === "trash"   && <TrashTab />}
          {tab === "search"  && <SearchTab />}
          {tab === "reports" && <ReportsTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
