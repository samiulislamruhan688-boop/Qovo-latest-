import React from "react";
import { Link, useLocation } from "wouter";
import { 
  BookOpen, 
  LayoutDashboard, 
  MessageSquare, 
  Trophy, 
  TrendingUp, 
  FileText,
  Flame,
  PlusSquare
} from "lucide-react";
import { useGetStreak, getGetStreakQueryKey } from "@workspace/api-client-react";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "হোম", icon: LayoutDashboard },
    { href: "/subjects", label: "বিষয়", icon: BookOpen },
    { href: "/tests", label: "মডেল টেস্ট", icon: FileText },
    { href: "/progress", label: "প্রগতি", icon: TrendingUp },
    { href: "/leaderboard", label: "লিডারবোর্ড", icon: Trophy },
    { href: "/chat", label: "এআই টিউটর", icon: MessageSquare },
    { href: "/import", label: "প্রশ্ন যোগ", icon: PlusSquare },
  ];

  return (
    <div className="flex min-h-screen bg-background flex-col md:flex-row">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-card">
        <div className="p-6">
          <Link href="/" className="flex items-center gap-2 font-bold text-2xl text-primary">
            <BookOpen className="w-8 h-8" />
            <span>শিক্ষা এআই</span>
          </Link>
          <div className="mt-2 inline-block px-2 py-1 bg-accent/20 text-accent-foreground text-xs rounded-full font-medium">
            সম্পূর্ণ ফ্রি
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                  isActive 
                    ? "bg-primary text-primary-foreground font-medium shadow-sm" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-0 relative pb-16 md:pb-0">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-4 md:px-8 border-b border-border bg-card/50 backdrop-blur sticky top-0 z-10">
          <div className="md:hidden flex items-center gap-2 font-bold text-xl text-primary">
            <BookOpen className="w-6 h-6" />
            <span>শিক্ষা</span>
          </div>
          
          <div className="flex items-center gap-4 ml-auto">
            <StreakBadge />
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-8">
          {children}
        </div>
      </main>

      {/* Bottom Nav for Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border flex items-center justify-around px-2 z-50">
        {navItems.map((item) => {
          const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
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
    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-100 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 rounded-full font-bold shadow-sm">
      <Flame className="w-4 h-4 fill-current" />
      <span>{streak.currentStreak} দিন</span>
    </div>
  );
}
