import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  useGetProgressSummary,
  useGetStreak,
  useImportQuestions,
  useGetQuestionStats,
  getGetQuestionStatsQueryKey,
  getListSubjectsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Camera,
  Pencil,
  Check,
  X,
  Trophy,
  Target,
  Flame,
  Brain,
  BookOpen,
  PlusSquare,
  Sparkles,
  Copy,
  CheckCircle2,
  AlertCircle,
  Layers,
  FileText,
  GraduationCap,
  Hash,
  Calendar,
  ChevronDown,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import qLogoSrc from "/qovo-q.png";

// ── localStorage helpers ────────────────────────────────────────────
function ls(key: string, fallback = "") {
  try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; }
}
function lsSet(key: string, val: string) {
  try { localStorage.setItem(key, val); } catch {}
}
function genStudyId(): string {
  const existing = ls("qovo-study-id");
  if (existing) return existing;
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  const id = `QV-${new Date().getFullYear()}-${rand}`;
  lsSet("qovo-study-id", id);
  return id;
}

const SSC_BATCHES = ["২০২৪", "২০২৫", "২০২৬", "২০২৭", "২০২৮", "২০২৯"];

const SAMPLE_CODE = `@subject: পদার্থবিজ্ঞান
@chapter: গতিবিদ্যা
@source: SSC ২০২৩ ঢাকা বোর্ড
@year: 2023
@difficulty: medium

Q: একটি বস্তুর গতিশক্তি ৪ গুণ হলে এর বেগ কত গুণ হবে?
A) ২ গুণ
B) ৪ গুণ
C) ১৬ গুণ
D) ৬৪ গুণ
Answer: A
Explain: KE = ½mv², বেগ ২ গুণ হলে KE = ½m(2v)² = 4 × ½mv² = ৪ গুণ।

---

Q: একটি গাড়ি 36 km/h বেগে চলছে। এর বেগ m/s এ কত?
A) 6
B) 10
C) 15
D) 20
Answer: B
Explain: 36 × (1000/3600) = 10 m/s`;

export default function ProfilePage() {
  const { data: summary, isLoading: loadingSummary } = useGetProgressSummary();
  const { data: streak, isLoading: loadingStreak } = useGetStreak();
  const { data: stats } = useGetQuestionStats();
  const importMutation = useImportQuestions();
  const queryClient = useQueryClient();

  // Profile state
  const [name, setName] = useState(() => ls("qovo-name", "শিক্ষার্থী"));
  const [batch, setBatch] = useState(() => ls("qovo-batch", "২০২৬"));
  const [photo, setPhoto] = useState(() => ls("qovo-photo", ""));
  const [studyId] = useState(genStudyId);
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState(name);
  const [showBatchPicker, setShowBatchPicker] = useState(false);
  const photoRef = useRef<HTMLInputElement>(null);

  // Import code state
  const [code, setCode] = useState("");
  const [copied, setCopied] = useState(false);

  const saveName = useCallback(() => {
    const n = tempName.trim() || "শিক্ষার্থী";
    setName(n);
    lsSet("qovo-name", n);
    setEditingName(false);
  }, [tempName]);

  const pickBatch = useCallback((b: string) => {
    setBatch(b);
    lsSet("qovo-batch", b);
    setShowBatchPicker(false);
  }, []);

  const handlePhoto = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const b64 = ev.target?.result as string;
      setPhoto(b64);
      lsSet("qovo-photo", b64);
    };
    reader.readAsDataURL(file);
  }, []);

  function handleImport() {
    if (!code.trim()) return;
    importMutation.mutate(
      { data: { code } },
      {
        onSuccess: (result) => {
          if (result.added > 0) {
            queryClient.invalidateQueries({ queryKey: getGetQuestionStatsQueryKey() });
            queryClient.invalidateQueries({ queryKey: getListSubjectsQueryKey() });
            setCode("");
          }
        },
      },
    );
  }

  const importResult = importMutation.data;
  const totalAnswered = (summary?.totalCorrect ?? 0) + ((summary as any)?.totalWrong ?? 0);
  const accuracy = summary?.accuracy ?? 0;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-10">

      {/* ── Hero / Profile card ─────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl p-7 md:p-9"
        style={{
          background: "var(--qovo-gradient-soft)",
          border: "1px solid rgba(70,100,255,0.2)",
        }}
      >
        {/* Ambient glow */}
        <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(147,51,255,0.15) 0%, transparent 70%)" }} />
        <div className="absolute -bottom-16 -left-10 w-48 h-48 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(0,180,255,0.12) 0%, transparent 70%)" }} />

        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6">
          {/* Photo */}
          <div className="relative flex-shrink-0">
            <div
              className="w-24 h-24 md:w-28 md:h-28 rounded-3xl overflow-hidden qovo-glow cursor-pointer border-2 border-primary/30 flex items-center justify-center"
              style={{ background: "var(--qovo-gradient)" }}
              onClick={() => photoRef.current?.click()}
              title="ছবি পরিবর্তন করুন"
            >
              {photo ? (
                <img src={photo} alt={name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl font-extrabold text-white">{name[0] ?? "প"}</span>
              )}
            </div>
            <button
              type="button"
              onClick={() => photoRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center shadow-lg border-2 border-card"
              style={{ background: "var(--qovo-gradient)" }}
            >
              <Camera className="w-3.5 h-3.5 text-white" />
            </button>
            <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
          </div>

          {/* Info */}
          <div className="flex-1 text-center md:text-left">
            {/* Name */}
            {editingName ? (
              <div className="flex items-center gap-2 justify-center md:justify-start mb-1">
                <input
                  autoFocus
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") saveName(); if (e.key === "Escape") setEditingName(false); }}
                  className="text-2xl font-bold bg-transparent border-b-2 border-primary outline-none text-foreground w-48"
                />
                <button type="button" onClick={saveName} className="p-1 rounded-lg bg-primary text-white">
                  <Check className="w-4 h-4" />
                </button>
                <button type="button" onClick={() => setEditingName(false)} className="p-1 rounded-lg bg-muted text-muted-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 justify-center md:justify-start mb-1">
                <h1 className="text-2xl md:text-3xl font-extrabold text-foreground">{name}</h1>
                <button
                  type="button"
                  onClick={() => { setTempName(name); setEditingName(true); }}
                  className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Batch picker */}
            <div className="relative inline-block mb-3">
              <button
                type="button"
                onClick={() => setShowBatchPicker((v) => !v)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border border-primary/30 hover:bg-muted transition-colors"
                style={{ background: "var(--qovo-gradient-soft)" }}
              >
                <Calendar className="w-3.5 h-3.5 text-primary" />
                <span className="qovo-gradient-text">SSC ব্যাচ {batch}</span>
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
              <AnimatePresence>
                {showBatchPicker && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    className="absolute top-full mt-1 left-0 z-50 bg-card border border-border rounded-2xl shadow-lg overflow-hidden min-w-[120px]"
                  >
                    {SSC_BATCHES.map((b) => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => pickBatch(b)}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-muted ${batch === b ? "font-bold text-primary" : "text-foreground"}`}
                      >
                        {b}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Study ID */}
            <div className="flex items-center gap-2 justify-center md:justify-start text-sm text-muted-foreground">
              <Hash className="w-3.5 h-3.5" />
              <span className="font-mono font-semibold">{studyId}</span>
              <span className="text-xs bg-muted px-2 py-0.5 rounded-full">স্টাডি আইডি</span>
            </div>
          </div>

          {/* Qovo badge */}
          <div className="hidden md:flex flex-col items-center gap-2">
            <img src={qLogoSrc} alt="Qovo" className="w-12 h-12 rounded-2xl qovo-glow-sm" />
            <span className="text-xs text-muted-foreground font-medium">প্রিমিয়াম শিক্ষার্থী</span>
          </div>
        </div>
      </motion.div>

      {/* ── Stats grid ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon={<Trophy className="w-5 h-5 text-yellow-500" />}
          label="মোট পয়েন্ট"
          value={summary?.totalPoints}
          loading={loadingSummary}
          color="#f59e0b"
        />
        <StatCard
          icon={<Target className="w-5 h-5 text-emerald-500" />}
          label="সঠিক উত্তর"
          value={summary?.totalCorrect}
          loading={loadingSummary}
          color="#10b981"
        />
        <StatCard
          icon={<Brain className="w-5 h-5 text-primary" />}
          label="সঠিকতার হার"
          value={summary ? `${Math.round(accuracy)}%` : undefined}
          loading={loadingSummary}
          color="hsl(var(--primary))"
        />
        <StatCard
          icon={<Flame className="w-5 h-5 text-orange-500" />}
          label="স্ট্রাইক"
          value={streak ? `${streak.currentStreak} দিন` : undefined}
          loading={loadingStreak}
          color="#f97316"
        />
      </div>

      {/* Accuracy bar */}
      {!loadingSummary && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-5 bg-card border border-border shadow-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-primary" />
              <span className="font-semibold text-sm">সামগ্রিক অগ্রগতি</span>
            </div>
            <span className="text-sm font-bold qovo-gradient-text">{Math.round(accuracy)}%</span>
          </div>
          <div className="h-2.5 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(accuracy, 100)}%` }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
              className="h-full rounded-full qovo-gradient"
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>{totalAnswered} টি প্রশ্নের উত্তর দেওয়া হয়েছে</span>
            <span>লেভেল: {summary?.level ?? 1}</span>
          </div>
        </motion.div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "MCQ অনুশীলন", href: "/subjects", icon: BookOpen, color: "text-primary", bg: "bg-primary/10" },
          { label: "মডেল টেস্ট", href: "/tests", icon: FileText, color: "text-accent", bg: "bg-accent/10" },
          { label: "আমার প্রগতি", href: "/progress", icon: Trophy, color: "text-yellow-600", bg: "bg-yellow-50 dark:bg-yellow-950/30" },
        ].map(({ label, href, icon: Icon, color, bg }) => (
          <Link key={href} href={href}>
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl ${bg} border border-border/50 cursor-pointer transition-all`}
            >
              <Icon className={`w-5 h-5 ${color}`} />
              <span className="text-xs font-semibold text-foreground text-center">{label}</span>
            </motion.div>
          </Link>
        ))}
      </div>

      {/* ── Add Question Section ─────────────────────────────────────── */}
      <div className="rounded-3xl border border-border overflow-hidden shadow-sm">
        {/* Header */}
        <div className="p-5 border-b border-border flex items-center gap-3"
          style={{ background: "var(--qovo-gradient-soft)" }}>
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "var(--qovo-gradient)" }}>
            <PlusSquare className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-foreground">প্রশ্ন যোগ করুন</h2>
            <p className="text-xs text-muted-foreground">কোড পেস্ট করে MCQ যোগ করুন</p>
          </div>
          {stats && (
            <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5" />{stats.totalQuestions.toLocaleString("bn-BD")} প্রশ্ন</span>
              <span className="flex items-center gap-1"><Layers className="w-3.5 h-3.5" />{stats.totalChapters} অধ্যায়</span>
            </div>
          )}
        </div>

        <div className="p-5 bg-card space-y-4">
          {/* Format info */}
          <div className="rounded-xl p-4 border border-secondary/20 bg-secondary/5 text-xs text-muted-foreground space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-foreground mb-2">
              <Sparkles className="w-3.5 h-3.5 text-secondary" /> কোড ফরম্যাট
            </div>
            <p><code className="text-secondary font-mono">@subject:</code> বিষয় &nbsp;·&nbsp; <code className="text-secondary font-mono">@chapter:</code> অধ্যায়</p>
            <p><code className="text-secondary font-mono">@difficulty:</code> easy / medium / hard</p>
            <p><code className="text-secondary font-mono">Q:</code> প্রশ্ন &nbsp; <code className="text-secondary font-mono">A) B) C) D)</code> &nbsp; <code className="text-secondary font-mono">Answer:</code> &nbsp; <code className="text-secondary font-mono">Explain:</code></p>
            <p>একাধিক প্রশ্নের মাঝে <code className="text-secondary font-mono">---</code> দিন।</p>
          </div>

          {/* Textarea */}
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/30">
              <span className="text-xs font-medium">আপনার কোড</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { navigator.clipboard.writeText(SAMPLE_CODE).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }); }}
                  className="text-xs flex items-center gap-1 px-2.5 py-1 rounded-lg bg-card border border-border hover:bg-muted"
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copied ? "কপি হয়েছে" : "নমুনা কপি"}
                </button>
                <button
                  type="button"
                  onClick={() => setCode(SAMPLE_CODE)}
                  className="text-xs px-2.5 py-1 rounded-lg bg-secondary/10 border border-secondary/30 text-foreground hover:bg-secondary/20"
                >
                  নমুনা লোড
                </button>
              </div>
            </div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={SAMPLE_CODE}
              className="w-full h-48 p-4 bg-transparent font-mono text-sm text-foreground placeholder:text-muted-foreground/40 resize-y focus:outline-none"
              spellCheck={false}
            />
          </div>

          {/* Submit */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleImport}
              disabled={!code.trim() || importMutation.isPending}
              className="flex-1 py-3 rounded-xl font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ background: "var(--qovo-gradient)" }}
            >
              <PlusSquare className="w-4 h-4" />
              {importMutation.isPending ? "যোগ করা হচ্ছে..." : "প্রশ্ন যোগ করুন"}
            </button>
            {code && (
              <button type="button" onClick={() => setCode("")} className="px-4 py-3 rounded-xl text-muted-foreground hover:bg-muted text-sm">
                পরিষ্কার
              </button>
            )}
          </div>

          {/* Result */}
          <AnimatePresence>
            {importResult && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`rounded-xl p-4 border flex items-start gap-3 ${
                  importResult.added > 0
                    ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900"
                    : "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900"
                }`}
              >
                {importResult.added > 0
                  ? <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  : <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                }
                <div className="text-sm">
                  <p className="font-semibold">
                    {importResult.added > 0
                      ? `সফল! ${importResult.added} টি প্রশ্ন যোগ হয়েছে`
                      : "কোনো নতুন প্রশ্ন যোগ হয়নি"}
                  </p>
                  {importResult.skipped > 0 && <p className="text-muted-foreground">{importResult.skipped} টি আগে থেকেই ছিল</p>}
                  {importResult.createdSubjects.length > 0 && <p className="text-muted-foreground">নতুন বিষয়: {importResult.createdSubjects.join(", ")}</p>}
                </div>
              </motion.div>
            )}
            {importMutation.isError && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl p-4 border bg-red-50 border-red-200 text-red-700 text-sm">
                সার্ভারে যোগাযোগে সমস্যা হয়েছে। আবার চেষ্টা করুন।
              </motion.div>
            )}
          </AnimatePresence>

          <p className="text-center text-xs text-muted-foreground">
            বিস্তারিত ফরম্যাট গাইডের জন্য{" "}
            <Link href="/import" className="text-primary hover:underline">প্রশ্ন যোগ পেজ</Link> দেখুন।
          </p>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, loading, color }: {
  icon: React.ReactNode; label: string; value?: string | number; loading: boolean; color: string;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-card border border-border rounded-2xl p-4 shadow-sm"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${color}18` }}>
          {icon}
        </div>
      </div>
      {loading ? (
        <Skeleton className="h-7 w-16 mb-1" />
      ) : (
        <div className="text-xl font-extrabold text-foreground">{value ?? 0}</div>
      )}
      <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
    </motion.div>
  );
}
