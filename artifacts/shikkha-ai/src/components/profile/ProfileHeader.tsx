import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import {
  Camera, Pencil, Check, X, Calendar, ChevronDown, Hash, MapPin,
  School, FlaskConical, Landmark, Briefcase, Save, GraduationCap,
  Star, Trophy, Zap,
} from "lucide-react";
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
export const SSC_BATCHES = [
  String(currentYear), String(currentYear + 1),
  String(currentYear + 2), String(currentYear + 3),
].map((y) => ({ label: `SSC ${y}`, value: y }));

export const SSC_GROUPS = [
  { value: "science",  label: "বিজ্ঞান বিভাগ",  Icon: FlaskConical,  color: "#10b981" },
  { value: "arts",     label: "মানবিক বিভাগ",   Icon: Landmark,      color: "#8b5cf6" },
  { value: "commerce", label: "ব্যবসায় শিক্ষা", Icon: Briefcase,     color: "#f59e0b" },
];

interface Props {
  level?: string;
  totalPoints?: number;
  rank?: number;
  onSavedToast: () => void;
  /** Expose current profile values upward so siblings can use them */
  onProfileChange?: (vals: { name: string; batch: string; group: string }) => void;
}

export function ProfileHeader({ level, totalPoints, rank, onSavedToast, onProfileChange }: Props) {
  const { user } = useAuth();

  const [name,     setName]     = useState(() => ls("qovo-name") || user?.name || "শিক্ষার্থী");
  const [batch,    setBatch]    = useState(() => ls("qovo-batch", String(currentYear)));
  const [photo,    setPhoto]    = useState(() => ls("qovo-photo", ""));
  const [group,    setGroup]    = useState(() => ls("qovo-group", "science"));
  const [school,   setSchool]   = useState(() => ls("qovo-school", ""));
  const [district, setDistrict] = useState(() => ls("qovo-district", ""));
  const [bio,      setBio]      = useState(() => ls("qovo-bio", ""));
  const [studyId]               = useState(genStudyId);

  const [editingName,    setEditingName]    = useState(false);
  const [editingDetails, setEditingDetails] = useState(false);
  const [tempName,       setTempName]       = useState(name);
  const [tempSchool,     setTempSchool]     = useState(school);
  const [tempDistrict,   setTempDistrict]   = useState(district);
  const [tempBio,        setTempBio]        = useState(bio);
  const [showBatch,      setShowBatch]      = useState(false);
  const [showGroup,      setShowGroup]      = useState(false);

  const photoRef = useRef<HTMLInputElement>(null);
  const currentGroup = SSC_GROUPS.find((g) => g.value === group) ?? SSC_GROUPS[0];
  const batchLabel   = SSC_BATCHES.find((b) => b.value === batch)?.label ?? `SSC ${batch}`;
  const displayPhoto = photo || user?.avatarUrl || "";

  const saveName = useCallback(() => {
    const n = tempName.trim() || user?.name || "শিক্ষার্থী";
    setName(n); lsSet("qovo-name", n); setEditingName(false);
    onProfileChange?.({ name: n, batch, group });
  }, [tempName, batch, group, user, onProfileChange]);

  const pickBatch = useCallback((v: string) => {
    setBatch(v); lsSet("qovo-batch", v); setShowBatch(false);
    onProfileChange?.({ name, batch: v, group });
  }, [name, group, onProfileChange]);

  const pickGroup = useCallback((v: string) => {
    setGroup(v); lsSet("qovo-group", v); setShowGroup(false);
    onProfileChange?.({ name, batch, group: v });
  }, [name, batch, onProfileChange]);

  const saveDetails = useCallback(() => {
    const s = tempSchool.trim(); const d = tempDistrict.trim(); const b = tempBio.trim();
    setSchool(s); lsSet("qovo-school", s);
    setDistrict(d); lsSet("qovo-district", d);
    setBio(b); lsSet("qovo-bio", b);
    setEditingDetails(false);
    onSavedToast();
  }, [tempSchool, tempDistrict, tempBio, onSavedToast]);

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

  const joinYear = user?.id ? Math.min(2024 + (user.id % 2), currentYear) : currentYear;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-3xl"
      style={{ border: "1px solid rgba(255,255,255,0.08)" }}
    >
      {/* Cover banner */}
      <div className="h-24 md:h-32 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0f1035 0%, #1a1060 30%, #2d1b6e 60%, #1a0a4e 100%)" }}>
        <div className="absolute inset-0"
          style={{ background: "radial-gradient(ellipse at 30% 50%, rgba(64,96,255,0.4) 0%, transparent 60%), radial-gradient(ellipse at 80% 30%, rgba(147,51,255,0.3) 0%, transparent 50%)" }} />
        <div className="absolute bottom-0 left-0 right-0 h-1/2"
          style={{ background: "linear-gradient(to bottom, transparent, rgba(0,0,0,0.3))" }} />
        {/* Decorative dots */}
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
      </div>

      {/* Content over the cover */}
      <div className="relative px-5 md:px-7 pb-5 md:pb-7"
        style={{ background: "linear-gradient(to bottom, rgba(10,10,30,0.95), rgba(8,8,25,0.98))" }}>

        {/* Avatar row */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-10 mb-4">
          <div className="flex items-end gap-4">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <button type="button" onClick={() => photoRef.current?.click()}
                className="block w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden ring-4 ring-card hover:ring-primary/50 transition-all qovo-glow-sm"
                style={{ background: "var(--qovo-gradient)" }}>
                {displayPhoto
                  ? <img src={displayPhoto} alt={name} className="w-full h-full object-cover" />
                  : <span className="flex items-center justify-center w-full h-full text-3xl font-extrabold text-white">{(name[0] ?? "প").toUpperCase()}</span>
                }
              </button>
              <button type="button" onClick={() => photoRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center shadow-lg border-2 border-card text-white"
                style={{ background: "var(--qovo-gradient)" }}>
                <Camera className="w-3 h-3" />
              </button>
              <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
            </div>

            {/* Name + badges */}
            <div className="pb-1">
              {editingName ? (
                <div className="flex items-center gap-2 mb-2">
                  <input autoFocus value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") saveName(); if (e.key === "Escape") setEditingName(false); }}
                    className="text-xl font-bold bg-transparent border-b-2 border-primary outline-none text-white w-40" />
                  <button type="button" onClick={saveName} className="p-1 rounded-lg bg-primary text-white"><Check className="w-3.5 h-3.5" /></button>
                  <button type="button" onClick={() => setEditingName(false)} className="p-1 rounded-lg bg-white/10 text-white/60"><X className="w-3.5 h-3.5" /></button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h1 className="text-xl md:text-2xl font-extrabold text-white">{name}</h1>
                  <button type="button" onClick={() => { setTempName(name); setEditingName(true); }}
                    className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white/40">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              {bio && !editingDetails && (
                <p className="text-xs text-white/50 italic mt-0.5 max-w-xs">{bio}</p>
              )}
            </div>
          </div>

          {/* Level / rank pills */}
          <div className="flex flex-wrap gap-2 pb-1">
            {level && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border border-yellow-500/30 bg-yellow-500/10 text-yellow-300">
                <Star className="w-3 h-3" /> {level}
              </span>
            )}
            {totalPoints !== undefined && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border border-purple-500/30 bg-purple-500/10 text-purple-300">
                <Zap className="w-3 h-3" /> {totalPoints.toLocaleString("bn-BD")} XP
              </span>
            )}
            {rank !== undefined && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border border-blue-500/30 bg-blue-500/10 text-blue-300">
                <Trophy className="w-3 h-3" /> Rank #{rank}
              </span>
            )}
          </div>
        </div>

        {/* Academic info row */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {/* Batch picker */}
          <div className="relative">
            <button type="button" onClick={() => { setShowBatch((v) => !v); setShowGroup(false); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border border-white/15 text-white/70 hover:bg-white/10 transition-colors bg-white/5">
              <Calendar className="w-3 h-3 text-primary" />
              <span className="qovo-gradient-text font-bold">{batchLabel}</span>
              <ChevronDown className="w-3 h-3" />
            </button>
            <AnimatePresence>
              {showBatch && (
                <motion.div initial={{ opacity: 0, y: -6, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.95 }}
                  className="absolute top-full mt-1 left-0 z-50 rounded-2xl shadow-2xl overflow-hidden min-w-[130px] border border-white/10"
                  style={{ background: "rgba(15,15,40,0.98)", backdropFilter: "blur(20px)" }}>
                  {SSC_BATCHES.map((b) => (
                    <button key={b.value} type="button" onClick={() => pickBatch(b.value)}
                      className={`w-full text-left px-4 py-2.5 text-xs transition-colors hover:bg-white/10 ${batch === b.value ? "font-bold text-primary" : "text-white/70"}`}>
                      {b.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Group picker */}
          <div className="relative">
            <button type="button" onClick={() => { setShowGroup((v) => !v); setShowBatch(false); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border border-white/15 text-white/70 hover:bg-white/10 transition-colors bg-white/5">
              <currentGroup.Icon className="w-3 h-3" style={{ color: currentGroup.color }} />
              {currentGroup.label}
              <ChevronDown className="w-3 h-3" />
            </button>
            <AnimatePresence>
              {showGroup && (
                <motion.div initial={{ opacity: 0, y: -6, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.95 }}
                  className="absolute top-full mt-1 left-0 z-50 rounded-2xl shadow-2xl overflow-hidden min-w-[160px] border border-white/10"
                  style={{ background: "rgba(15,15,40,0.98)", backdropFilter: "blur(20px)" }}>
                  {SSC_GROUPS.map((g) => (
                    <button key={g.value} type="button" onClick={() => pickGroup(g.value)}
                      className={`w-full text-left px-4 py-2.5 text-xs flex items-center gap-2 transition-colors hover:bg-white/10 ${group === g.value ? "font-bold" : "text-white/70"}`}>
                      <g.Icon className="w-3.5 h-3.5" style={{ color: g.color }} />
                      {g.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Study ID */}
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono text-white/40 border border-white/10 bg-white/5">
            <Hash className="w-3 h-3" /> {studyId}
          </span>

          {/* Join date */}
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-white/40 border border-white/10 bg-white/5">
            <GraduationCap className="w-3 h-3" /> Since {joinYear}
          </span>

          {/* Qovo logo */}
          <span className="ml-auto hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-white/40 border border-white/10 bg-white/5">
            <img src={qLogoSrc} alt="Qovo" className="w-4 h-4 rounded" />
            প্রিমিয়াম শিক্ষার্থী
          </span>
        </div>

        {/* School / district */}
        {(school || district) && !editingDetails && (
          <div className="flex flex-wrap items-center gap-3 mb-3 text-xs text-white/40">
            {school    && <span className="flex items-center gap-1"><School className="w-3 h-3" />{school}</span>}
            {district  && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{district}</span>}
          </div>
        )}

        {/* Edit details */}
        <AnimatePresence>
          {editingDetails && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden">
              <div className="pt-4 border-t border-white/10 grid gap-3">
                {[
                  { label: "বিদ্যালয়ের নাম", val: tempSchool, set: setTempSchool, Icon: School, ph: "যেমন: ঢাকা কলেজিয়েট স্কুল" },
                  { label: "জেলা", val: tempDistrict, set: setTempDistrict, Icon: MapPin, ph: "যেমন: ঢাকা, চট্টগ্রাম" },
                ].map(({ label, val, set, Icon, ph }) => (
                  <div key={label}>
                    <label className="text-xs font-semibold text-white/50 mb-1.5 block">{label}</label>
                    <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-white/15 bg-white/5">
                      <Icon className="w-4 h-4 text-white/30 flex-shrink-0" />
                      <input value={val} onChange={(e) => set(e.target.value)} placeholder={ph}
                        className="flex-1 bg-transparent text-sm text-white placeholder:text-white/25 outline-none" />
                    </div>
                  </div>
                ))}
                <div>
                  <label className="text-xs font-semibold text-white/50 mb-1.5 block">পরিচিতি (Bio)</label>
                  <textarea value={tempBio} onChange={(e) => setTempBio(e.target.value)}
                    placeholder="নিজের সম্পর্কে কিছু লিখুন…" rows={2}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-white/15 bg-white/5 text-sm text-white placeholder:text-white/25 outline-none resize-none" />
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={saveDetails}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white font-semibold text-sm"
                    style={{ background: "var(--qovo-gradient)" }}>
                    <Save className="w-4 h-4" /> সংরক্ষণ
                  </button>
                  <button type="button" onClick={() => setEditingDetails(false)}
                    className="px-4 py-2.5 rounded-xl border border-white/15 text-sm text-white/50 hover:bg-white/10">
                    বাতিল
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!editingDetails && (
          <button type="button"
            onClick={() => { setTempSchool(school); setTempDistrict(district); setTempBio(bio); setEditingDetails(true); }}
            className="mt-1 flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 transition-colors text-white/40">
            <Pencil className="w-3 h-3" /> বিস্তারিত সম্পাদনা
          </button>
        )}
      </div>
    </motion.div>
  );
}
