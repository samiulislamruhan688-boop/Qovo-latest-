import { useMemo, useState } from "react";
import { useListSubjects } from "@workspace/api-client-react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FlaskConical,
  Landmark,
  Briefcase,
  BookMarked,
  BookOpen,
  Layers,
  HelpCircle,
} from "lucide-react";
import * as Icons from "lucide-react";

interface SubjectCard {
  id: number;
  name: string;
  nameBn: string;
  icon: string;
  color: string;
  description: string;
  chapterCount: number;
  questionCount: number;
  category?: string | null;
}

const GROUPS = [
  {
    key: "all",
    label: "সব বিষয়",
    icon: BookOpen,
    gradient: "from-blue-500 to-cyan-500",
    bg: "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400",
  },
  {
    key: "compulsory",
    label: "সাধারণ",
    icon: BookMarked,
    gradient: "from-blue-500 to-indigo-500",
    bg: "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400",
  },
  {
    key: "science",
    label: "বিজ্ঞান",
    icon: FlaskConical,
    gradient: "from-emerald-500 to-teal-500",
    bg: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400",
  },
  {
    key: "commerce",
    label: "ব্যবসায়",
    icon: Briefcase,
    gradient: "from-amber-500 to-orange-500",
    bg: "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400",
  },
  {
    key: "arts",
    label: "মানবিক",
    icon: Landmark,
    gradient: "from-purple-500 to-pink-500",
    bg: "bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400",
  },
];

const CATEGORY_META: Record<string, { label: string; gradient: string; icon: typeof BookOpen }> = {
  compulsory: { label: "সাধারণ বিষয়", gradient: "from-blue-500 to-indigo-500", icon: BookMarked },
  science:    { label: "বিজ্ঞান বিভাগ", gradient: "from-emerald-500 to-teal-500", icon: FlaskConical },
  commerce:   { label: "ব্যবসায় শিক্ষা", gradient: "from-amber-500 to-orange-500", icon: Briefcase },
  arts:       { label: "মানবিক বিভাগ", gradient: "from-purple-500 to-pink-500", icon: Landmark },
};

const ALLOWED_CATEGORIES = ["compulsory", "science", "commerce", "arts"];
const CATEGORY_ORDER = ["compulsory", "science", "commerce", "arts"];

export default function Subjects() {
  const { data: subjects, isLoading } = useListSubjects();
  const [activeGroup, setActiveGroup] = useState("all");

  // Filter only SSC-relevant subjects (exclude optional category)
  const sscSubjects = useMemo<SubjectCard[]>(() => {
    if (!subjects) return [];
    return subjects.filter((s) =>
      ALLOWED_CATEGORIES.includes(s.category ?? ""),
    ) as SubjectCard[];
  }, [subjects]);

  const filteredSubjects = useMemo<SubjectCard[]>(() => {
    if (activeGroup === "all") return sscSubjects;
    return sscSubjects.filter((s) => s.category === activeGroup);
  }, [sscSubjects, activeGroup]);

  const grouped = useMemo<{ key: string; subjects: SubjectCard[] }[]>(() => {
    if (activeGroup !== "all") {
      return [{ key: activeGroup, subjects: filteredSubjects }];
    }
    const map = new Map<string, SubjectCard[]>();
    for (const s of sscSubjects) {
      const key = s.category ?? "compulsory";
      const arr = map.get(key) ?? [];
      arr.push(s);
      map.set(key, arr);
    }
    return CATEGORY_ORDER.filter((k) => map.has(k)).map((k) => ({
      key: k,
      subjects: map.get(k) ?? [],
    }));
  }, [sscSubjects, activeGroup, filteredSubjects]);

  return (
    <div className="max-w-6xl mx-auto space-y-7">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-foreground mb-1">SSC পাঠ্যসূচি</h1>
        <p className="text-muted-foreground text-sm">
          বিভাগ বেছে নাও — অধ্যায়ভিত্তিক বা একাধিক অধ্যায় একসাথে MCQ অনুশীলন করো
        </p>
      </div>

      {/* Group filter tabs */}
      <div className="flex flex-wrap gap-2">
        {GROUPS.map((g) => {
          const Icon = g.icon;
          const isActive = activeGroup === g.key;
          return (
            <button
              key={g.key}
              type="button"
              onClick={() => setActiveGroup(g.key)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-semibold border transition-all ${
                isActive
                  ? "text-white border-transparent shadow-md"
                  : "bg-card border-border text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
              style={isActive ? { background: "var(--qovo-gradient)" } : {}}
            >
              <Icon className="w-4 h-4" />
              {g.label}
              {g.key !== "all" && sscSubjects.filter(s => s.category === g.key).length > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-0.5 ${isActive ? "bg-white/20" : "bg-muted"}`}>
                  {sscSubjects.filter(s => s.category === g.key).length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-44 rounded-2xl" />)}
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={activeGroup}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-10"
          >
            {grouped.map(({ key, subjects: list }) => {
              const meta = CATEGORY_META[key];
              if (!meta) return null;
              const Icon = meta.icon;
              return (
                <section key={key}>
                  {activeGroup === "all" && (
                    <div className="flex items-center gap-3 mb-5">
                      <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${meta.gradient} text-white flex items-center justify-center shadow-md`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <h2 className="text-xl font-bold text-foreground">{meta.label}</h2>
                      <span className="text-sm text-muted-foreground">· {list.length}টি বিষয়</span>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {list.map((subject, i) => {
                      const SIcon = (
                        (Icons as unknown as Record<string, Icons.LucideIcon>)[subject.icon] ??
                        Icons.BookOpen
                      ) as Icons.LucideIcon;
                      return (
                        <motion.div
                          key={subject.id}
                          initial={{ opacity: 0, y: 14 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.04 }}
                        >
                          <Link href={`/subjects/${subject.id}`}>
                            <div className="group h-full relative overflow-hidden rounded-2xl border border-border bg-card cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-primary/30">
                              {/* Gradient blob */}
                              <div
                                className="absolute top-0 right-0 w-28 h-28 rounded-full opacity-[0.12] -mr-8 -mt-8 transition-transform group-hover:scale-110 group-hover:opacity-20"
                                style={{ backgroundColor: subject.color }}
                              />
                              <div className="p-5 flex flex-col h-full relative z-10">
                                <div
                                  className="w-11 h-11 rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110"
                                  style={{ backgroundColor: `${subject.color}20`, color: subject.color }}
                                >
                                  <SIcon className="w-5 h-5" />
                                </div>
                                <h3 className="text-lg font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
                                  {subject.nameBn}
                                </h3>
                                <p className="text-xs text-muted-foreground mb-4 line-clamp-2 flex-1">
                                  {subject.description}
                                </p>
                                <div className="flex items-center justify-between mt-auto">
                                  <div className="flex items-center gap-3 text-xs font-medium text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                      <Layers className="w-3.5 h-3.5" />
                                      {subject.chapterCount} অধ্যায়
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <HelpCircle className="w-3.5 h-3.5" />
                                      {subject.questionCount} প্রশ্ন
                                    </span>
                                  </div>
                                  <span
                                    className="text-xs font-semibold px-2.5 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-all -translate-x-1 group-hover:translate-x-0"
                                    style={{ background: `${subject.color}20`, color: subject.color }}
                                  >
                                    অধ্যায় দেখুন →
                                  </span>
                                </div>
                              </div>
                            </div>
                          </Link>
                        </motion.div>
                      );
                    })}
                  </div>
                </section>
              );
            })}

            {grouped.length === 0 && (
              <div className="text-center py-16 text-muted-foreground">
                <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>কোনো বিষয় পাওয়া যায়নি।</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
