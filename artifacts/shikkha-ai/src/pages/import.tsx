import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useImportQuestions,
  useGetQuestionStats,
  getGetQuestionStatsQueryKey,
  getListSubjectsQueryKey,
} from "@workspace/api-client-react";
import {
  PlusSquare,
  CheckCircle2,
  AlertCircle,
  FileText,
  Layers,
  BookOpen,
  Copy,
  Check,
  Sparkles,
  Shield,
} from "lucide-react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";

const SAMPLE_CODE = `@subject: পদার্থবিজ্ঞান
@chapter: গতিবিদ্যা
@source: HSC ২০২৩ ঢাকা বোর্ড
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
Explain: 36 × (1000/3600) = 10 m/s

---

@chapter: তরঙ্গ

Q: শব্দ তরঙ্গ কোন ধরনের তরঙ্গ?
A) আড় তরঙ্গ
B) অনুদৈর্ঘ্য তরঙ্গ
C) তড়িৎচুম্বকীয় তরঙ্গ
D) স্থির তরঙ্গ
Answer: B
Explain: শব্দ একটি যান্ত্রিক অনুদৈর্ঘ্য তরঙ্গ।`;

export default function ImportPage() {
  const [code, setCode] = useState("");
  const [copied, setCopied] = useState(false);
  const queryClient = useQueryClient();
  const { data: stats } = useGetQuestionStats();
  const importMutation = useImportQuestions();

  const isAdmin = (() => { try { return !!sessionStorage.getItem("qovo-admin-token"); } catch { return false; } })();

  if (!isAdmin) {
    return (
      <div className="max-w-5xl mx-auto flex flex-col items-center justify-center py-24 text-center space-y-4">
        <Shield className="w-14 h-14 text-muted-foreground opacity-30" />
        <h1 className="text-xl font-bold text-foreground">অ্যাডমিন প্রবেশ দেও</h1>
        <p className="text-sm text-muted-foreground max-w-sm">প্রশ্ন যোগ করতে অ্যাডমিন PIN দিয়ে প্রবেশ করুন। প্রোফাইল পেজে অ্যাডমিন প্যানেল বিকল্প থেকে PIN লিখুন।</p>
        <Link href="/profile" className="mt-2 text-sm font-semibold text-primary hover:underline">প্রোফাইল পেজে যান</Link>
      </div>
    );
  }

  function handleSubmit() {
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

  function loadSample() {
    setCode(SAMPLE_CODE);
  }

  function copySample() {
    navigator.clipboard.writeText(SAMPLE_CODE).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  const result = importMutation.data;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <PlusSquare className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">প্রশ্ন যোগ করুন</h1>
        </div>
        <p className="text-muted-foreground">
          একটি কোড পেস্ট করুন এবং একসাথে অনেকগুলো MCQ যোগ করুন। বিষয় বা অধ্যায় না থাকলে আপনাআপনি তৈরি হবে।
        </p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-card rounded-2xl p-4 border border-border">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <FileText className="w-4 h-4" />
              মোট প্রশ্ন
            </div>
            <div className="text-2xl font-bold">{stats.totalQuestions.toLocaleString("bn-BD")}</div>
          </div>
          <div className="bg-card rounded-2xl p-4 border border-border">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <BookOpen className="w-4 h-4" />
              মোট বিষয়
            </div>
            <div className="text-2xl font-bold">{stats.totalSubjects.toLocaleString("bn-BD")}</div>
          </div>
          <div className="bg-card rounded-2xl p-4 border border-border">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Layers className="w-4 h-4" />
              মোট অধ্যায়
            </div>
            <div className="text-2xl font-bold">{stats.totalChapters.toLocaleString("bn-BD")}</div>
          </div>
        </div>
      )}

      {/* Format guide */}
      <div className="bg-secondary/5 border border-secondary/20 rounded-2xl p-5">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-secondary" />
            <h2 className="font-semibold text-foreground">কোড ফরম্যাট</h2>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={copySample}
              className="text-xs px-3 py-1.5 rounded-lg bg-card border border-border hover:bg-muted flex items-center gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "কপি হয়েছে" : "নমুনা কপি"}
            </button>
            <button
              type="button"
              onClick={loadSample}
              className="text-xs px-3 py-1.5 rounded-lg bg-secondary/10 border border-secondary/30 text-secondary-foreground hover:bg-secondary/20"
            >
              নমুনা লোড করুন
            </button>
          </div>
        </div>
        <ul className="text-sm text-muted-foreground space-y-1.5 mb-3">
          <li>
            <code className="text-secondary font-mono">@subject:</code> বিষয়ের নাম —
            <code className="text-secondary font-mono">@chapter:</code> অধ্যায়ের নাম
          </li>
          <li>
            <code className="text-secondary font-mono">@source:</code> কোন বছরের / কোন পরীক্ষা (ঐচ্ছিক) —
            <code className="text-secondary font-mono">@year:</code> বছর (ঐচ্ছিক)
          </li>
          <li>
            <code className="text-secondary font-mono">@difficulty:</code> easy / medium / hard
          </li>
          <li>
            <code className="text-secondary font-mono">Q:</code> প্রশ্ন,{" "}
            <code className="text-secondary font-mono">A) B) C) D)</code> অপশন,{" "}
            <code className="text-secondary font-mono">Answer:</code> সঠিক অপশন,{" "}
            <code className="text-secondary font-mono">Explain:</code> ব্যাখ্যা
          </li>
          <li>
            একাধিক প্রশ্নের মাঝে <code className="text-secondary font-mono">---</code> দিন।
            পরের প্রশ্নে subject/chapter আবার লিখতে হবে না — পূর্বের মান চলতে থাকে।
          </li>
        </ul>
      </div>

      {/* Editor */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">আপনার কোড</span>
          <span className="text-xs text-muted-foreground">{code.length.toLocaleString("bn-BD")} অক্ষর</span>
        </div>
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder={SAMPLE_CODE}
          className="w-full h-96 p-4 bg-transparent font-mono text-sm text-foreground placeholder:text-muted-foreground/50 resize-y focus:outline-none"
          spellCheck={false}
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!code.trim() || importMutation.isPending}
          className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <PlusSquare className="w-5 h-5" />
          {importMutation.isPending ? "যোগ করা হচ্ছে..." : "প্রশ্ন যোগ করুন"}
        </button>
        {code && (
          <button
            type="button"
            onClick={() => setCode("")}
            className="px-4 py-3 rounded-xl text-muted-foreground hover:bg-muted text-sm"
          >
            পরিষ্কার করুন
          </button>
        )}
      </div>

      {/* Result */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            <div
              className={`rounded-2xl p-5 border ${
                result.added > 0
                  ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900"
                  : "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900"
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                {result.added > 0 ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-amber-600" />
                )}
                <div className="font-semibold text-lg">
                  {result.added > 0
                    ? `সফল! ${result.added.toLocaleString("bn-BD")} টি প্রশ্ন যোগ হয়েছে`
                    : "কোনো নতুন প্রশ্ন যোগ হয়নি"}
                </div>
              </div>
              <div className="text-sm text-muted-foreground space-y-1 ml-9">
                {result.skipped > 0 && (
                  <div>{result.skipped.toLocaleString("bn-BD")} টি প্রশ্ন আগে থেকেই ছিল (এড়িয়ে যাওয়া হয়েছে)</div>
                )}
                {result.createdSubjects.length > 0 && (
                  <div>নতুন বিষয় তৈরি: {result.createdSubjects.join(", ")}</div>
                )}
                {result.createdChapters.length > 0 && (
                  <div>নতুন অধ্যায় তৈরি: {result.createdChapters.join(", ")}</div>
                )}
              </div>
            </div>
            {result.errors.length > 0 && (
              <div className="rounded-2xl p-5 border bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900">
                <div className="flex items-center gap-2 mb-2 font-semibold text-red-700 dark:text-red-300">
                  <AlertCircle className="w-5 h-5" />
                  {result.errors.length.toLocaleString("bn-BD")} টি ত্রুটি পাওয়া গেছে
                </div>
                <ul className="text-sm space-y-1 ml-7 text-red-700 dark:text-red-300">
                  {result.errors.slice(0, 10).map((err, i) => (
                    <li key={i}>
                      <span className="font-mono text-xs">লাইন {err.line}:</span> {err.message}
                    </li>
                  ))}
                  {result.errors.length > 10 && (
                    <li className="text-red-600/70">আরও {result.errors.length - 10} টি…</li>
                  )}
                </ul>
              </div>
            )}
          </motion.div>
        )}
        {importMutation.isError && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-2xl p-5 border bg-red-50 border-red-200 text-red-700"
          >
            সার্ভারে যোগাযোগে সমস্যা হয়েছে। আবার চেষ্টা করুন।
          </motion.div>
        )}
      </AnimatePresence>

      {/* By source breakdown */}
      {stats && stats.bySource.length > 0 && (
        <div className="bg-card rounded-2xl p-5 border border-border">
          <h3 className="font-semibold text-foreground mb-3">উৎস অনুযায়ী প্রশ্ন</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {stats.bySource.map((s) => (
              <div
                key={s.source}
                className="flex items-center justify-between p-3 rounded-xl bg-muted/40"
              >
                <span className="text-sm text-foreground">{s.source}</span>
                <span className="text-sm font-semibold text-primary">
                  {s.count.toLocaleString("bn-BD")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
