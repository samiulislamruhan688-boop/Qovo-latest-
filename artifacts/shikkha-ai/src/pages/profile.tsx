import { useState, useCallback, useRef } from "react";
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
  Camera, Pencil, Check, X, Trophy, Target, Flame, Brain,
  BookOpen, PlusSquare, Sparkles, Copy, CheckCircle2, AlertCircle,
  Layers, FileText, GraduationCap, Hash, Calendar, ChevronDown,
  MapPin, School, FlaskConical, BookMarked, Landmark, Briefcase,
  Save, Shield, ShieldCheck, ShieldOff, KeyRound, Loader2,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import qLogoSrc from "/qovo-q.png";

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

const currentYear = new Date().getFullYear();
const SSC_BATCHES = [
  String(currentYear),
  String(currentYear + 1),
  String(currentYear + 2),
  String(currentYear + 3),
].map((y) => ({ label: `SSC ${y}`, value: y }));

const SSC_GROUPS = [
  { value: "science",  label: "বিজ্ঞান বিভাগ",  Icon: FlaskConical,  color: "#10b981" },
  { value: "arts",     label: "মানবিক বিভাগ",   Icon: Landmark,      color: "#8b5cf6" },
  { value: "commerce", label: "ব্যবসায় শিক্ষা", Icon: Briefcase,     color: "#f59e0b" },
];

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

  // ── Profile fields ──────────────────────────────────────
  const [name,     setName]     = useState(() => ls("qovo-name", "শিক্ষার্থী"));
  const [batch,    setBatch]    = useState(() => ls("qovo-batch", String(currentYear)));
  const [photo,    setPhoto]    = useState(() => ls("qovo-photo", ""));
  const [group,    setGroup]    = useState(() => ls("qovo-group", "science"));
  const [school,   setSchool]   = useState(() => ls("qovo-school", ""));
  const [district, setDistrict] = useState(() => ls("qovo-district", ""));
  const [bio,      setBio]      = useState(() => ls("qovo-bio", ""));
  const [studyId]  = useState(genStudyId);

  // Edit modes
  const [editingName,     setEditingName]     = useState(false);
  const [editingDetails,  setEditingDetails]  = useState(false);
  const [tempName,        setTempName]        = useState(name);
  const [tempSchool,      setTempSchool]      = useState(school);
  const [tempDistrict,    setTempDistrict]    = useState(district);
  const [tempBio,         setTempBio]         = useState(bio);
  const [showBatchPicker, setShowBatchPicker] = useState(false);
  const [showGroupPicker, setShowGroupPicker] = useState(false);
  const [savedToast,      setSavedToast]      = useState(false);

  // Admin PIN
  const [pinActive,  setPinActive]  = useState(() => { try { return !!sessionStorage.getItem("qovo-admin-token"); } catch { return false; } });
  const [pinOpen,    setPinOpen]    = useState(false);
  const [pinValue,   setPinValue]   = useState("");
  const [pinError,   setPinError]   = useState("");
  const [pinLoading, setPinLoading] = useState(false);

  const handleVerifyPin = async () => {
    if (pinValue.length !== 6) { setPinError("৬ সংখ্যার PIN দিন"); return; }
    setPinLoading(true); setPinError("");
    try {
      const res = await fetch("/api/admin/verify-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: pinValue }),
      });
      if (!res.ok) { const d = await res.json(); setPinError(d.error ?? "ভুল PIN"); setPinLoading(false); return; }
      const { token } = await res.json();
      sessionStorage.setItem("qovo-admin-token", token);
      setPinActive(true); setPinOpen(false); setPinValue(""); setPinError("");
    } catch { setPinError("সংযোগ ত্রুটি"); }
    setPinLoading(false);
  };

  const handleAdminLogout = () => {
    sessionStorage.removeItem("qovo-admin-token");
    setPinActive(false); setPinOpen(false); setPinValue(""); setPinError("");
  };

  // Import
  const [code,    setCode]    = useState("");
  const [copied,  setCopied]  = useState(false);
  const photoRef = useRef<HTMLInputElement>(null);

  const saveName = useCallback(() => {
    const n = tempName.trim() || "শিক্ষার্থী";
    setName(n); lsSet("qovo-name", n); setEditingName(false);
  }, [tempName]);

  const pickBatch = useCallback((v: string) => {
    setBatch(v); lsSet("qovo-batch", v); setShowBatchPicker(false);
  }, []);

  const pickGroup = useCallback((v: string) => {
    setGroup(v); lsSet("qovo-group", v); setShowGroupPicker(false);
  }, []);

  const saveDetails = useCallback(() => {
    const s = tempSchool.trim();
    const d = tempDistrict.trim();
    const b = tempBio.trim();
    setSchool(s); lsSet("qovo-school", s);
    setDistrict(d); lsSet("qovo-district", d);
    setBio(b); lsSet("qovo-bio", b);
    setEditingDetails(false);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2000);
  }, [tempSchool, tempDistrict, tempBio]);

  const handlePhoto = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const b64 = ev.target?.result as string;
      setPhoto(b64); lsSet("qovo-photo", b64);
    };
    reader.readAsDataURL(file);
  }, []);

  function handleImport() {
    if (!code.trim()) return;
    importMutation.mutate({ data: { code } }, {
      onSuccess: (result) => {
        if (result.added > 0) {
          queryClient.invalidateQueries({ queryKey: getGetQuestionStatsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getListSubjectsQueryKey() });
          setCode("");
        }
      },
    });
  }

  const importResult = importMutation.data;
  const accuracy = summary?.accuracy ?? 0;
  const totalAnswered = summary?.totalCorrect ?? 0;
  const currentGroup = SSC_GROUPS.find((g) => g.value === group) ?? SSC_GROUPS[0];
  const batchLabel = SSC_BATCHES.find((b) => b.value === batch)?.label ?? `SSC ${batch}`;

  return (
    <div className="max-w-3xl mx-auto space-y-5 pb-10">

      {/* ── Saved toast ── */}
      <AnimatePresence>
        {savedToast && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="fixed top-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold text-white shadow-xl"
            style={{ background: "var(--qovo-gradient)" }}
          >
            <Check className="w-4 h-4" /> পরিবর্তন সেভ হয়েছে
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Hero card ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl p-6 md:p-8"
        style={{ background: "var(--qovo-gradient-soft)", border: "1px solid rgba(70,100,255,0.2)" }}
      >
        <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(147,51,255,0.15) 0%, transparent 70%)" }} />
        <div className="absolute -bottom-16 -left-10 w-48 h-48 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(0,180,255,0.12) 0%, transparent 70%)" }} />

        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-5">
          {/* Photo */}
          <div className="relative flex-shrink-0">
            <div
              className="w-24 h-24 rounded-3xl overflow-hidden qovo-glow cursor-pointer border-2 border-primary/30 flex items-center justify-center"
              style={{ background: "var(--qovo-gradient)" }}
              onClick={() => photoRef.current?.click()}
            >
              {photo
                ? <img src={photo} alt={name} className="w-full h-full object-cover" />
                : <span className="text-4xl font-extrabold text-white">{name[0] ?? "প"}</span>
              }
            </div>
            <button type="button" onClick={() => photoRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center shadow-lg border-2 border-card"
              style={{ background: "var(--qovo-gradient)" }}>
              <Camera className="w-3.5 h-3.5 text-white" />
            </button>
            <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
          </div>

          {/* Info */}
          <div className="flex-1 text-center md:text-left">
            {/* Name */}
            {editingName ? (
              <div className="flex items-center gap-2 justify-center md:justify-start mb-2">
                <input autoFocus value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") saveName(); if (e.key === "Escape") setEditingName(false); }}
                  className="text-2xl font-bold bg-transparent border-b-2 border-primary outline-none text-foreground w-44" />
                <button type="button" onClick={saveName} className="p-1 rounded-lg bg-primary text-white"><Check className="w-4 h-4" /></button>
                <button type="button" onClick={() => setEditingName(false)} className="p-1 rounded-lg bg-muted text-muted-foreground"><X className="w-4 h-4" /></button>
              </div>
            ) : (
              <div className="flex items-center gap-2 justify-center md:justify-start mb-2">
                <h1 className="text-2xl md:text-3xl font-extrabold text-foreground">{name}</h1>
                <button type="button" onClick={() => { setTempName(name); setEditingName(true); }}
                  className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
                  <Pencil className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Bio */}
            {bio && !editingDetails && (
              <p className="text-sm text-muted-foreground mb-2 italic">{bio}</p>
            )}

            {/* Badges row */}
            <div className="flex flex-wrap items-center gap-2 justify-center md:justify-start">
              {/* Batch picker */}
              <div className="relative">
                <button type="button" onClick={() => setShowBatchPicker((v) => !v)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border border-primary/30 hover:bg-muted transition-colors"
                  style={{ background: "var(--qovo-gradient-soft)" }}>
                  <Calendar className="w-3.5 h-3.5 text-primary" />
                  <span className="qovo-gradient-text">{batchLabel}</span>
                  <ChevronDown className="w-3 h-3 text-muted-foreground" />
                </button>
                <AnimatePresence>
                  {showBatchPicker && (
                    <motion.div initial={{ opacity: 0, y: -8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.95 }}
                      className="absolute top-full mt-1 left-0 z-50 bg-card border border-border rounded-2xl shadow-lg overflow-hidden min-w-[130px]">
                      {SSC_BATCHES.map((b) => (
                        <button key={b.value} type="button" onClick={() => pickBatch(b.value)}
                          className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-muted ${batch === b.value ? "font-bold text-primary" : "text-foreground"}`}>
                          {b.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Group picker */}
              <div className="relative">
                <button type="button" onClick={() => setShowGroupPicker((v) => !v)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border border-border hover:bg-muted transition-colors bg-card">
                  <currentGroup.Icon className="w-3.5 h-3.5" style={{ color: currentGroup.color }} />
                  <span className="text-foreground">{currentGroup.label}</span>
                  <ChevronDown className="w-3 h-3 text-muted-foreground" />
                </button>
                <AnimatePresence>
                  {showGroupPicker && (
                    <motion.div initial={{ opacity: 0, y: -8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.95 }}
                      className="absolute top-full mt-1 left-0 z-50 bg-card border border-border rounded-2xl shadow-lg overflow-hidden min-w-[160px]">
                      {SSC_GROUPS.map((g) => (
                        <button key={g.value} type="button" onClick={() => pickGroup(g.value)}
                          className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 transition-colors hover:bg-muted ${group === g.value ? "font-bold" : "text-foreground"}`}>
                          <g.Icon className="w-4 h-4" style={{ color: g.color }} />
                          {g.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Study ID */}
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono bg-muted text-muted-foreground border border-border">
                <Hash className="w-3 h-3" /> {studyId}
              </span>
            </div>

            {/* School / district row */}
            {(school || district) && !editingDetails && (
              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground justify-center md:justify-start">
                {school && <span className="flex items-center gap-1"><School className="w-3 h-3" />{school}</span>}
                {district && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{district}</span>}
              </div>
            )}
          </div>

          {/* Qovo badge */}
          <div className="hidden md:flex flex-col items-center gap-1">
            <img src={qLogoSrc} alt="Qovo" className="w-11 h-11 rounded-2xl qovo-glow-sm" />
            <span className="text-[10px] text-muted-foreground font-medium">প্রিমিয়াম</span>
          </div>
        </div>

        {/* Edit details section */}
        <AnimatePresence>
          {editingDetails && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden">
              <div className="mt-5 pt-4 border-t border-border/50 grid gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">বিদ্যালয়ের নাম</label>
                  <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-border bg-card/70">
                    <School className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <input value={tempSchool} onChange={(e) => setTempSchool(e.target.value)}
                      placeholder="যেমন: ঢাকা কলেজিয়েট স্কুল"
                      className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 outline-none" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">জেলা</label>
                  <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-border bg-card/70">
                    <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <input value={tempDistrict} onChange={(e) => setTempDistrict(e.target.value)}
                      placeholder="যেমন: ঢাকা, চট্টগ্রাম, রাজশাহী"
                      className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 outline-none" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">পরিচিতি (Bio)</label>
                  <textarea value={tempBio} onChange={(e) => setTempBio(e.target.value)}
                    placeholder="নিজের সম্পর্কে কিছু লিখুন…"
                    rows={2}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-card/70 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none resize-none" />
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={saveDetails}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white font-semibold text-sm"
                    style={{ background: "var(--qovo-gradient)" }}>
                    <Save className="w-4 h-4" /> সংরক্ষণ করুন
                  </button>
                  <button type="button" onClick={() => setEditingDetails(false)}
                    className="px-4 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted">
                    বাতিল
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Edit profile button (only when not editing) */}
        {!editingDetails && (
          <button type="button"
            onClick={() => { setTempSchool(school); setTempDistrict(district); setTempBio(bio); setEditingDetails(true); }}
            className="relative z-10 mt-4 flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-full border border-border/60 bg-card/50 hover:bg-card transition-colors text-muted-foreground">
            <Pencil className="w-3.5 h-3.5" /> বিস্তারিত সম্পাদনা
          </button>
        )}
      </motion.div>

      {/* ── Stats grid ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={<Trophy className="w-5 h-5 text-yellow-500" />} label="মোট পয়েন্ট" value={summary?.totalPoints} loading={loadingSummary} color="#f59e0b" />
        <StatCard icon={<Target className="w-5 h-5 text-emerald-500" />} label="সঠিক উত্তর" value={summary?.totalCorrect} loading={loadingSummary} color="#10b981" />
        <StatCard icon={<Brain className="w-5 h-5 text-primary" />} label="সঠিকতার হার" value={summary ? `${Math.round(accuracy)}%` : undefined} loading={loadingSummary} color="hsl(var(--primary))" />
        <StatCard icon={<Flame className="w-5 h-5 text-orange-500" />} label="স্ট্রাইক" value={streak ? `${streak.currentStreak} দিন` : undefined} loading={loadingStreak} color="#f97316" />
      </div>

      {/* Accuracy progress bar */}
      {!loadingSummary && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-5 bg-card border border-border shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-primary" />
              <span className="font-semibold text-sm">সামগ্রিক অগ্রগতি</span>
            </div>
            <span className="text-sm font-bold qovo-gradient-text">{Math.round(accuracy)}%</span>
          </div>
          <div className="h-2.5 bg-muted rounded-full overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(accuracy, 100)}%` }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
              className="h-full rounded-full qovo-gradient" />
          </div>
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>{totalAnswered} টি সঠিক উত্তর</span>
            <span>লেভেল: {summary?.level ?? 1}</span>
          </div>
        </motion.div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "MCQ অনুশীলন", href: "/subjects", Icon: BookOpen, color: "text-primary", bg: "bg-primary/10" },
          { label: "মডেল টেস্ট",  href: "/tests",    Icon: FileText, color: "text-accent",  bg: "bg-accent/10" },
          { label: "প্রগতি",       href: "/progress", Icon: Trophy,   color: "text-yellow-600", bg: "bg-yellow-50 dark:bg-yellow-950/30" },
        ].map(({ label, href, Icon, color, bg }) => (
          <Link key={href} href={href}>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl ${bg} border border-border/50 cursor-pointer`}>
              <Icon className={`w-5 h-5 ${color}`} />
              <span className="text-xs font-semibold text-foreground text-center">{label}</span>
            </motion.div>
          </Link>
        ))}
      </div>

      {/* ── Admin Access ── */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${pinActive ? "bg-emerald-500/15" : "bg-muted"}`}>
              {pinActive
                ? <ShieldCheck className="w-4.5 h-4.5 text-emerald-500" />
                : <Shield className="w-4.5 h-4.5 text-muted-foreground" />}
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground">অ্যাডমিন প্যানেল</div>
              <div className="text-xs text-muted-foreground">
                {pinActive ? "সক্রিয় — প্রশ্ন মুছতে ও পরিচালনা করতে পারবেন" : "PIN দিয়ে প্রবেশ করুন"}
              </div>
            </div>
          </div>
          {pinActive ? (
            <button type="button" onClick={handleAdminLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-border bg-muted hover:bg-muted/80 text-muted-foreground transition-colors">
              <ShieldOff className="w-3.5 h-3.5" /> লগআউট
            </button>
          ) : (
            <button type="button" onClick={() => { setPinOpen((v) => !v); setPinValue(""); setPinError(""); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-primary/40 text-primary hover:bg-primary/10 transition-colors">
              <KeyRound className="w-3.5 h-3.5" /> PIN লিখুন
            </button>
          )}
        </div>

        <AnimatePresence>
          {pinOpen && !pinActive && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-border"
            >
              <div className="p-4 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <input
                    autoFocus
                    type="password"
                    inputMode="numeric"
                    maxLength={6}
                    value={pinValue}
                    onChange={(e) => { setPinValue(e.target.value.replace(/\D/g, "").slice(0, 6)); setPinError(""); }}
                    onKeyDown={(e) => { if (e.key === "Enter") handleVerifyPin(); if (e.key === "Escape") setPinOpen(false); }}
                    placeholder="• • • • • •"
                    className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-card/70 text-sm font-mono text-center tracking-[0.4em] outline-none focus:border-primary transition-colors"
                  />
                  <button type="button" onClick={handleVerifyPin} disabled={pinLoading || pinValue.length !== 6}
                    className="px-4 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50 transition-opacity flex items-center gap-1.5"
                    style={{ background: "var(--qovo-gradient)" }}>
                    {pinLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    প্রবেশ
                  </button>
                </div>
                {pinError && (
                  <p className="text-xs text-destructive font-semibold text-center">{pinError}</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Add Question Section ── */}
      <div className="rounded-3xl border border-border overflow-hidden shadow-sm">
        <div className="p-5 border-b border-border flex items-center gap-3" style={{ background: "var(--qovo-gradient-soft)" }}>
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "var(--qovo-gradient)" }}>
            <PlusSquare className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-foreground">প্রশ্ন যোগ করুন</h2>
            <p className="text-xs text-muted-foreground">কোড পেস্ট করে একসাথে অনেক MCQ যোগ করুন</p>
          </div>
          {stats && (
            <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5" />{stats.totalQuestions.toLocaleString("bn-BD")} প্রশ্ন</span>
              <span className="flex items-center gap-1"><Layers className="w-3.5 h-3.5" />{stats.totalChapters} অধ্যায়</span>
            </div>
          )}
        </div>

        <div className="p-5 bg-card space-y-4">
          <div className="rounded-xl p-4 border border-secondary/20 bg-secondary/5 text-xs text-muted-foreground space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-foreground mb-2">
              <Sparkles className="w-3.5 h-3.5 text-secondary" /> কোড ফরম্যাট
            </div>
            <p><code className="text-secondary font-mono">@subject:</code> বিষয় &nbsp;·&nbsp; <code className="text-secondary font-mono">@chapter:</code> অধ্যায়</p>
            <p><code className="text-secondary font-mono">@difficulty:</code> easy / medium / hard &nbsp;·&nbsp; <code className="text-secondary font-mono">@year:</code> বছর</p>
            <p><code className="text-secondary font-mono">Q:</code> প্রশ্ন &nbsp; <code className="text-secondary font-mono">A) B) C) D)</code> &nbsp; <code className="text-secondary font-mono">Answer:</code> &nbsp; <code className="text-secondary font-mono">Explain:</code></p>
          </div>

          <div className="rounded-xl border border-border overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/30">
              <span className="text-xs font-medium">আপনার কোড</span>
              <div className="flex gap-2">
                <button type="button"
                  onClick={() => { navigator.clipboard.writeText(SAMPLE_CODE).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }); }}
                  className="text-xs flex items-center gap-1 px-2.5 py-1 rounded-lg bg-card border border-border hover:bg-muted">
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copied ? "কপি হয়েছে" : "নমুনা কপি"}
                </button>
                <button type="button" onClick={() => setCode(SAMPLE_CODE)}
                  className="text-xs px-2.5 py-1 rounded-lg bg-secondary/10 border border-secondary/30 hover:bg-secondary/20">
                  নমুনা লোড
                </button>
              </div>
            </div>
            <textarea value={code} onChange={(e) => setCode(e.target.value)}
              placeholder={SAMPLE_CODE} rows={8}
              className="w-full p-4 bg-transparent font-mono text-sm text-foreground placeholder:text-muted-foreground/40 resize-y focus:outline-none" spellCheck={false} />
          </div>

          <div className="flex items-center gap-3">
            <button type="button" onClick={handleImport} disabled={!code.trim() || importMutation.isPending}
              className="flex-1 py-3 rounded-xl font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ background: "var(--qovo-gradient)" }}>
              <PlusSquare className="w-4 h-4" />
              {importMutation.isPending ? "যোগ করা হচ্ছে..." : "প্রশ্ন যোগ করুন"}
            </button>
            {code && (
              <button type="button" onClick={() => setCode("")} className="px-4 py-3 rounded-xl text-muted-foreground hover:bg-muted text-sm">
                পরিষ্কার
              </button>
            )}
          </div>

          <AnimatePresence>
            {importResult && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className={`rounded-xl p-4 border flex items-start gap-3 ${importResult.added > 0 ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900" : "bg-amber-50 border-amber-200 dark:bg-amber-950/20"}`}>
                {importResult.added > 0
                  ? <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  : <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                }
                <div className="text-sm">
                  <p className="font-semibold">{importResult.added > 0 ? `সফল! ${importResult.added}টি প্রশ্ন যোগ হয়েছে` : "নতুন প্রশ্ন যোগ হয়নি"}</p>
                  {importResult.skipped > 0 && <p className="text-muted-foreground">{importResult.skipped}টি আগে থেকেই ছিল</p>}
                  {importResult.createdSubjects.length > 0 && <p className="text-muted-foreground">নতুন বিষয়: {importResult.createdSubjects.join(", ")}</p>}
                </div>
              </motion.div>
            )}
            {importMutation.isError && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="rounded-xl p-4 border bg-red-50 border-red-200 text-red-700 text-sm">
                সার্ভারে যোগাযোগে সমস্যা হয়েছে। আবার চেষ্টা করুন।
              </motion.div>
            )}
          </AnimatePresence>

          <p className="text-center text-xs text-muted-foreground">
            বিস্তারিত ফরম্যাটের জন্য <Link href="/import" className="text-primary hover:underline">প্রশ্ন যোগ পেজ</Link> দেখুন।
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
    <motion.div whileHover={{ scale: 1.02 }} className="bg-card border border-border rounded-2xl p-4 shadow-sm">
      <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-3" style={{ background: `${color}18` }}>
        {icon}
      </div>
      {loading ? <Skeleton className="h-7 w-16 mb-1" /> : <div className="text-xl font-extrabold text-foreground">{value ?? 0}</div>}
      <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
    </motion.div>
  );
}
