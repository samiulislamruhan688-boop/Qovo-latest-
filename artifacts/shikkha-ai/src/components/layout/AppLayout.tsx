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
} from "lucide-react";
import { useGetStreak } from "@workspace/api-client-react";
import { QovoLogo } from "@/components/QovoLogo";
import { useTheme } from "@/components/ThemeProvider";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "হোম", icon: LayoutDashboard },
    { href: "/subjects", label: "বিষয়", icon: GraduationCap },
    { href: "/tests", label: "মডেল টেস্ট", icon: FileText },
    { href: "/progress", label: "প্রগতি", icon: TrendingUp },
    { href: "/leaderboard", label: "লিডারবোর্ড", icon: Trophy },
    { href: "/chat", label: "টিউটর", icon: MessageSquare },
    { href: "/review", label: "রিভিউ", icon: BookmarkCheck },
    { href: "/import", label: "প্রশ্ন যোগ", icon: PlusSquare },
  ];

  return (
    <div className="flex min-h-screen bg-background flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-sidebar">
        <div className="p-6">
          <Link href="/" className="block">
            <QovoLogo size={36} />
          </Link>
          <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 qovo-gradient-soft border border-secondary/30 text-secondary text-xs rounded-full font-semibold">
            SSC প্রস্তুতি · ফ্রি
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive =
              location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${
                  isActive
                    ? "qovo-gradient text-white font-semibold shadow-md qovo-glow"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <ThemeToggle />
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-h-0 relative pb-16 md:pb-0">
        <header className="h-16 flex items-center justify-between px-4 md:px-8 border-b border-border bg-card/70 backdrop-blur sticky top-0 z-10">
          <div className="md:hidden">
            <QovoLogo size={28} />
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <div className="md:hidden">
              <ThemeToggle compact />
            </div>
            <StreakBadge />
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-8">{children}</div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border flex items-center justify-around px-2 z-50">
        {navItems.slice(0, 5).map((item) => {
          const isActive =
            location === item.href || (item.href !== "/" && location.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? "fill-primary/20" : ""}`} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function StreakBadge() {
  const { data: streak } = useGetStreak();
  if (!streak) return null;
  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-300 rounded-full font-bold shadow-sm">
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
        className="w-9 h-9 rounded-full flex items-center justify-center text-foreground hover:bg-muted transition-colors"
      >
        {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-muted transition-colors text-sm font-medium text-foreground"
    >
      <span className="flex items-center gap-2">
        {isDark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        {isDark ? "ডার্ক মোড" : "লাইট মোড"}
      </span>
      <span
        className={`w-9 h-5 rounded-full relative transition-colors ${
          isDark ? "bg-primary" : "bg-muted-foreground/30"
        }`}
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
