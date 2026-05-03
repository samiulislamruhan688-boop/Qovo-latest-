import { useListSubjects } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { FileText, PlayCircle, BookOpen } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

interface SubjectItem {
  id: number;
  name: string;
  nameBn: string;
  icon: string;
  color: string;
  description: string;
  category?: string | null;
  questionCount: number;
  chapterCount: number;
}

const CATEGORY_META: Record<string, { label: string; icon: string; gradient: string }> = {
  compulsory: { label: "📘 আবশ্যিক বিষয়", icon: "📘", gradient: "from-blue-500 to-cyan-500" },
  science:    { label: "🔬 বিজ্ঞান বিভাগ", icon: "🔬", gradient: "from-emerald-500 to-teal-500" },
  commerce:   { label: "🟡 ব্যবসায় শিক্ষা", icon: "🟡", gradient: "from-amber-500 to-orange-500" },
  arts:       { label: "🟢 মানবিক বিভাগ",  icon: "🟢", gradient: "from-purple-500 to-pink-500" },
  optional:   { label: "🎯 ঐচ্ছিক / অতিরিক্ত", icon: "🎯", gradient: "from-slate-500 to-slate-600" },
};
const CATEGORY_ORDER = ["compulsory", "science", "commerce", "arts", "optional"];

export default function Tests() {
  const { data: subjects, isLoading } = useListSubjects();

  const grouped = useMemo<{ key: string; subjects: SubjectItem[] }[]>(() => {
    if (!subjects) return [];
    const map = new Map<string, SubjectItem[]>();
    for (const s of subjects as SubjectItem[]) {
      const key = s.category && CATEGORY_META[s.category] ? s.category : "optional";
      const arr = map.get(key) ?? [];
      arr.push(s);
      map.set(key, arr);
    }
    return CATEGORY_ORDER.filter((k) => map.has(k)).map((k) => ({ key: k, subjects: map.get(k) ?? [] }));
  }, [subjects]);

  return (
    <div className="max-w-5xl mx-auto space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <FileText className="w-8 h-8 text-primary" />
          মডেল টেস্ট
        </h1>
        <p className="text-muted-foreground mt-1">
          বিষয় নির্বাচন করুন — প্রশ্নসংখ্যা ও সময় নিজে কাস্টমাইজ করুন — পরীক্ষা দিন
        </p>
      </div>

      {/* How it works */}
      <div className="grid grid-cols-3 gap-4 text-center text-sm">
        {[
          { icon: "📚", label: "বিষয় বেছে নাও" },
          { icon: "⚙️", label: "সময় ও প্রশ্ন ঠিক করো" },
          { icon: "🏆", label: "পরীক্ষা দাও ও AI বিশ্লেষণ পাও" },
        ].map(({ icon, label }, i) => (
          <div key={i} className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-muted/50 border border-border/50">
            <span className="text-2xl">{icon}</span>
            <span className="text-muted-foreground font-medium">{label}</span>
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-8">
          {[1, 2].map((g) => (
            <div key={g}>
              <Skeleton className="h-6 w-40 mb-4" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-44 rounded-2xl" />)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-10">
          {grouped.map(({ key, subjects: list }) => {
            const meta = CATEGORY_META[key];
            return (
              <section key={key}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={cn("w-8 h-8 rounded-full bg-gradient-to-br flex items-center justify-center text-white text-sm font-bold", meta.gradient)}>
                    {meta.icon}
                  </div>
                  <h2 className="text-lg font-bold">{meta.label}</h2>
                  <span className="text-muted-foreground text-sm">· {list.length}টি বিষয়</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {list.map((s, idx) => (
                    <motion.div
                      key={s.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <Card className="h-full border-border hover:border-primary/40 hover:shadow-md transition-all duration-200 flex flex-col">
                        <CardContent className="p-5 flex flex-col h-full">
                          {/* Subject icon + name */}
                          <div className="flex items-start gap-3 mb-3">
                            <div
                              className="w-11 h-11 rounded-xl flex items-center justify-center text-white flex-shrink-0"
                              style={{ backgroundColor: s.color + "20", color: s.color }}
                            >
                              <BookOpen className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-bold text-base leading-tight">{s.nameBn}</h3>
                              <p className="text-xs text-muted-foreground mt-0.5">{s.name}</p>
                            </div>
                          </div>

                          <p className="text-xs text-muted-foreground leading-relaxed flex-1 mb-3 line-clamp-2">
                            {s.description}
                          </p>

                          {/* Stats */}
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
                            <span className="flex items-center gap-1">
                              <span>📚</span> {s.chapterCount} অধ্যায়
                            </span>
                            <span className="flex items-center gap-1">
                              <span>❓</span> {s.questionCount} প্রশ্ন
                            </span>
                          </div>

                          {/* CTA */}
                          {s.questionCount > 0 ? (
                            <Link href={`/tests/subject/${s.id}`}>
                              <Button
                                className="w-full rounded-xl qovo-gradient text-white border-0 h-10 text-sm"
                                size="sm"
                              >
                                <PlayCircle className="w-4 h-4 mr-1.5" /> মডেল টেস্ট দাও
                              </Button>
                            </Link>
                          ) : (
                            <div className="w-full rounded-xl border-2 border-dashed border-border h-10 flex items-center justify-center text-xs text-muted-foreground">
                              প্রশ্ন যোগ করুন
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
