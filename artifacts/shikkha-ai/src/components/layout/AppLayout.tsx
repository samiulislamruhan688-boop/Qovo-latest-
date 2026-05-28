import React from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  MessageSquare,
  Trophy,
  TrendingUp,
  FileText,
  Flame,
  PlusSquare,
  GraduationCap,
  Sun,
  Moon,
  BookmarkCheck,
  UserCircle2,
} from "lucide-react";
import { useGetStreak } from "@workspace/api-client-react";
import { useTheme } from "@/components/ThemeProvider";
import qLogoSrc from "/qovo-q.png";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { href: "/",            label: "হোম",         icon: LayoutDashboard },
    { href: "/subjects",    label: "বিষয়",         icon: GraduationCap },
    { href: "/tests",       label: "মডেল টেস্ট",   icon: FileText },
    { href: "/progress",    label: "প্রগতি",        icon: TrendingUp },
    { href: "/leaderboard", label: "লিডারবোর্ড",   icon: Trophy },
    { href: "/chat",        label: "টিউটর",         icon: MessageSquare },
    { href: "/review",      label: "রিভিউ",         icon: BookmarkCheck },
    { href: "/profile",     label: "প্রোফাইল",      icon: UserCircle2 },
    { href: "/import",      label: "প্রশ্ন যোগ",    icon: PlusSquare },
  ];

  // Mobile shows first 5 items + profile
  const mobileNav = [
    navItems[0], // হোম
    navItems[1], // বিষয়
    navItems[2], // মডেল টেস্ট
    navItems[4], // লিডারবোর্ড
    navItems[7], // প্রোফাইল
  ];

  return (
    <div className="flex min-h-screen bg-background flex-col md:flex-row">

      {/* ── Desktop Sidebar ─────────────────────────────────────────── */}
      <aside
        className="hidden md:flex w-64 flex-col border-r border-border/60 relative overflow-hidden"
        style={{ background: "hsl(var(--sidebar))" }}
      >
        {/* Ambient glow behind logo */}
        <div
          className="absolute top-0 left-0 w-full h-40 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 50% -10%, rgba(70,100,255,0.18) 0%, transparent 70%)",
          }}
        />

        {/* Logo */}
        <div className="relative p-5 pb-4">
          <Link href="/" className="block">
            <div className="flex items-center gap-3">
              <img
                src={qLogoSrc}
                alt="Qovo"
                className="rounded-2xl qovo-glow-sm"
                style={{ width: 40, height: 40 }}
              />
              <div>
                <div
                  className="font-extrabold qovo-gradient-text tracking-tight leading-none"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 22 }}
                >
                  Qovo
                </div>
                <div className="text-[10px] text-muted-foreground font-medium mt-0.5 tracking-wide">
                  SSC প্রস্তুতি
                </div>
              </div>
            </div>
          </Link>

          <div
            className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
            style={{
              background: "var(--qovo-gradient-soft)",
              border: "1px solid rgba(70,100,255,0.25)",
              color: "hsl(var(--primary))",
            }}
          >
            ✦ সম্পূর্ণ বিনামূল্যে
          </div>
        </div>

        {/* Divider */}
        <div
          className="mx-5 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(70,100,255,0.3), transparent)",
          }}
        />

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive =
              location === item.href ||
              (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? "text-white font-semibold shadow-lg"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`}
                style={
                  isActive
                    ? {
                        background: "var(--qovo-gradient)",
                        boxShadow:
                          "0 4px 20px -4px rgba(70,100,255,0.5), 0 0 0 1px rgba(255,255,255,0.08)",
                      }
                    : {}
                }
              >
                <item.icon
                  className={`w-[18px] h-[18px] flex-shrink-0 ${
                    isActive
                      ? "drop-shadow-sm"
                      : "group-hover:scale-110 transition-transform"
                  }`}
                />
                <span className="text-sm">{item.label}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white/70" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom: theme + branding */}
        <div className="p-4 border-t border-border/50 space-y-3">
          <ThemeToggle />
          <div className="text-center text-[10px] text-muted-foreground/50">
            Qovo · SSC Smart Prep
          </div>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-h-0 relative pb-16 md:pb-0">
        {/* Sticky header */}
        <header
          className="h-14 flex items-center justify-between px-4 md:px-6 border-b border-border/60 sticky top-0 z-10"
          style={{
            background: "hsl(var(--background) / 0.85)",
            backdropFilter: "blur(20px) saturate(180%)",
            WebkitBackdropFilter: "blur(20px) saturate(180%)",
          }}
        >
          <div className="md:hidden">
            <Link href="/">
              <div className="flex items-center gap-2">
                <img
                  src={qLogoSrc}
                  alt="Qovo"
                  className="rounded-xl qovo-glow-sm"
                  style={{ width: 30, height: 30 }}
                />
                <span
                  className="font-extrabold qovo-gradient-text text-lg"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  Qovo
                </span>
              </div>
            </Link>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <div className="md:hidden">
              <ThemeToggle compact />
            </div>
            <StreakBadge />
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-7">{children}</div>
      </main>

      {/* ── Mobile bottom nav ────────────────────────────────────────── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50"
        style={{
          background: "hsl(var(--background) / 0.92)",
          backdropFilter: "blur(24px) saturate(200%)",
          WebkitBackdropFilter: "blur(24px) saturate(200%)",
          borderTop: "1px solid hsl(var(--border) / 0.6)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <div className="flex items-center justify-around h-16 px-1">
          {mobileNav.map((item) => {
            const isActive =
              location === item.href ||
              (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center w-full h-full gap-1 transition-all"
              >
                <div
                  className={`relative w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                    isActive ? "qovo-glow-sm" : "hover:bg-muted"
                  }`}
                  style={isActive ? { background: "var(--qovo-gradient)" } : {}}
                >
                  <item.icon
                    className={`w-4 h-4 ${
                      isActive ? "text-white" : "text-muted-foreground"
                    }`}
                  />
                </div>
                <span
                  className={`text-[9px] font-medium ${
                    isActive ? "qovo-gradient-text font-bold" : "text-muted-foreground"
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function StreakBadge() {
  const { data: streak } = useGetStreak();
  if (!streak?.currentStreak) return null;
  return (
    <div
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold text-sm shadow-sm"
      style={{
        background:
          "linear-gradient(135deg, rgba(251,146,60,0.15), rgba(239,68,68,0.15))",
        border: "1px solid rgba(251,146,60,0.3)",
        color: "#f97316",
      }}
    >
      <Flame className="w-4 h-4 fill-current" />
      <span className="tabular-nums">{streak.currentStreak}</span>
    </div>
  );
}

function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  if (compact) {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        aria-label="থিম পরিবর্তন"
        className="w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
      >
        {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-border/60 bg-card/40 hover:bg-muted/60 transition-all text-sm font-medium text-foreground"
    >
      <span className="flex items-center gap-2">
        {isDark ? (
          <Moon className="w-4 h-4 text-primary" />
        ) : (
          <Sun className="w-4 h-4 text-amber-500" />
        )}
        {isDark ? "ডার্ক মোড" : "লাইট মোড"}
      </span>
      <span
        className={`w-9 h-5 rounded-full relative transition-all ${
          isDark ? "" : "bg-muted-foreground/20"
        }`}
        style={isDark ? { background: "var(--qovo-gradient)" } : {}}
      >
        <span
          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${
            isDark ? "left-[18px]" : "left-0.5"
          }`}
        />
      </span>
    </button>
  );
}
