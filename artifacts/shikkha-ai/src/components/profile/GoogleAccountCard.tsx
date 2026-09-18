import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut, ExternalLink, RefreshCw, UserCircle2, CheckCircle, AlertTriangle } from "lucide-react";

export function GoogleAccountCard() {
  const { user, refetch } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
      await refetch();
      window.location.href = "/";
    } catch {
      setLoggingOut(false);
      setShowLogoutConfirm(false);
    }
  };

  const avatarSrc = user?.avatarUrl;
  const initials = (user?.name ?? "?")[0]?.toUpperCase();

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-white/10 p-5"
        style={{ background: "linear-gradient(135deg, rgba(30,30,60,0.85) 0%, rgba(20,20,45,0.9) 100%)", backdropFilter: "blur(20px)" }}
      >
        {/* Glow orbs */}
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full pointer-events-none opacity-20"
          style={{ background: "radial-gradient(circle, #4060FF 0%, transparent 70%)" }} />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full pointer-events-none opacity-15"
          style={{ background: "radial-gradient(circle, #9333FF 0%, transparent 70%)" }} />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            {avatarSrc ? (
              <img src={avatarSrc} alt={user?.name} className="w-14 h-14 rounded-2xl object-cover ring-2 ring-primary/40 qovo-glow-sm" />
            ) : (
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-extrabold text-white ring-2 ring-primary/40"
                style={{ background: "var(--qovo-gradient)" }}>
                {initials}
              </div>
            )}
            <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-card flex items-center justify-center">
              <CheckCircle className="w-3 h-3 text-white" />
            </span>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-extrabold text-white text-base leading-tight truncate">{user?.name ?? "—"}</h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <CheckCircle className="w-2.5 h-2.5" /> Google verified
              </span>
            </div>
            <p className="text-sm text-blue-300/80 truncate mt-0.5">{user?.email ?? ""}</p>
            <p className="text-xs text-white/40 mt-0.5 flex items-center gap-1">
              <UserCircle2 className="w-3 h-3" /> Signed in with Google
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 sm:flex-col sm:items-end">
            <a
              href="https://myaccount.google.com"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white/70 border border-white/15 hover:bg-white/10 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Manage Account
            </a>
            <a
              href="/api/auth/google"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-blue-300 border border-blue-500/30 hover:bg-blue-500/10 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Switch Account
            </a>
            <button
              type="button"
              onClick={() => setShowLogoutConfirm(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-red-400 border border-red-500/30 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" /> Logout
            </button>
          </div>
        </div>
      </motion.div>

      {/* Logout confirmation glassmorphism dialog */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}
            onClick={() => setShowLogoutConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="relative overflow-hidden rounded-3xl border border-white/15 p-8 max-w-sm w-full text-center"
              style={{ background: "linear-gradient(135deg, rgba(25,25,55,0.95) 0%, rgba(15,15,35,0.98) 100%)", backdropFilter: "blur(30px)" }}
            >
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-32 h-32 rounded-full pointer-events-none opacity-25"
                style={{ background: "radial-gradient(circle, #ef4444 0%, transparent 70%)" }} />

              <div className="relative z-10">
                <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-red-500/20 border border-red-500/30">
                  <AlertTriangle className="w-8 h-8 text-red-400" />
                </div>
                <h3 className="text-xl font-extrabold text-white mb-2">লগআউট করবেন?</h3>
                <p className="text-sm text-white/50 mb-6">আপনার সেশন শেষ হয়ে যাবে। পরবর্তীতে আবার Google দিয়ে লগইন করতে পারবেন।</p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowLogoutConfirm(false)}
                    className="flex-1 py-3 rounded-2xl text-sm font-semibold text-white/70 border border-white/15 hover:bg-white/10 transition-colors"
                  >
                    বাতিল
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="flex-1 py-3 rounded-2xl text-sm font-bold text-white bg-red-500 hover:bg-red-600 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
                  >
                    {loggingOut ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <LogOut className="w-4 h-4" />}
                    লগআউট
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
