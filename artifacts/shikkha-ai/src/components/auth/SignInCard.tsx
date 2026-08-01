import { motion } from "framer-motion";

interface SignInCardProps {
  message?: string;
  fullPage?: boolean;
}

export function SignInCard({
  message = "Please sign in to view your profile and save your progress.",
  fullPage = true,
}: SignInCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col items-center justify-center p-6 ${fullPage ? "min-h-[60vh]" : "py-10"}`}
    >
      <div
        className="relative overflow-hidden rounded-3xl p-10 flex flex-col items-center gap-5 text-center max-w-md w-full shadow-2xl border border-white/10"
        style={{
          background: "rgba(255,255,255,0.04)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        {/* Glow orbs */}
        <div
          className="absolute -top-16 -right-16 w-52 h-52 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(147,51,255,0.25) 0%, transparent 70%)" }}
        />
        <div
          className="absolute -bottom-14 -left-14 w-44 h-44 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(0,180,255,0.18) 0%, transparent 70%)" }}
        />

        <div className="relative z-10 flex flex-col items-center gap-5">
          {/* Logo mark */}
          <div
            className="w-16 h-16 rounded-3xl flex items-center justify-center qovo-glow"
            style={{ background: "var(--qovo-gradient)" }}
          >
            <span className="text-white font-extrabold text-3xl leading-none">Q</span>
          </div>

          <div>
            <h2 className="text-2xl font-extrabold text-foreground mb-2">
              Welcome to Qovo
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
              {message}
            </p>
          </div>

          <button
            type="button"
            onClick={() => { window.location.href = "/api/auth/google"; }}
            className="flex items-center gap-3 px-7 py-3.5 bg-white text-gray-800 font-semibold rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-transform border border-gray-200"
          >
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg"
              alt="Google"
              className="w-5 h-5"
            />
            Sign in with Google
          </button>
        </div>
      </div>
    </motion.div>
  );
}
