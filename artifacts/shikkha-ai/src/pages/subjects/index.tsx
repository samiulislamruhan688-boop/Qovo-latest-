import { useMemo } from "react";
import { useListSubjects } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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

const CATEGORY_LABELS: Record<string, { label: string; gradient: string; icon: keyof typeof Icons }> = {
  compulsory: { label: "বাধ্যতামূলক বিষয়", gradient: "from-blue-500 to-cyan-500", icon: "BookMarked" },
  science: { label: "বিজ্ঞান বিভাগ", gradient: "from-emerald-500 to-teal-500", icon: "FlaskConical" },
  commerce: { label: "ব্যবসায় শিক্ষা", gradient: "from-amber-500 to-orange-500", icon: "Briefcase" },
  arts: { label: "মানবিক বিভাগ", gradient: "from-purple-500 to-pink-500", icon: "Landmark" },
  optional: { label: "ঐচ্ছিক / অন্যান্য", gradient: "from-slate-500 to-slate-700", icon: "Sparkles" },
};

const CATEGORY_ORDER = ["compulsory", "science", "commerce", "arts", "optional"];

export default function Subjects() {
  const { data: subjects, isLoading } = useListSubjects();

  const grouped = useMemo<{ key: string; subjects: SubjectCard[] }[]>(() => {
    if (!subjects) return [];
    const map = new Map<string, SubjectCard[]>();
    for (const s of subjects) {
      const key = s.category && CATEGORY_LABELS[s.category] ? s.category : "optional";
      const arr = map.get(key) ?? [];
      arr.push(s);
      map.set(key, arr);
    }
    return CATEGORY_ORDER.filter((k) => map.has(k)).map((k) => ({
      key: k,
      subjects: map.get(k) ?? [],
    }));
  }, [subjects]);

  return (
    <div className="max-w-6xl mx-auto space-y-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-foreground">SSC পাঠ্যসূচি</h1>
        <p className="text-muted-foreground">
          বিভাগ অনুযায়ী যেকোনো বিষয় বেছে নিয়ে অনুশীলন শুরু করো
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-44 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-12">
          {grouped.map(({ key, subjects: list }) => {
            const meta = CATEGORY_LABELS[key];
            const Icon = (Icons[meta.icon] ?? Icons.BookOpen) as Icons.LucideIcon;
            return (
              <section key={key}>
                <div className="flex items-center gap-3 mb-5">
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${meta.gradient} text-white flex items-center justify-center shadow-md`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-bold text-foreground">{meta.label}</h2>
                  <span className="text-sm text-muted-foreground">· {list.length} বিষয়</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {list.map((subject) => {
                    const SIcon = ((Icons as unknown as Record<string, Icons.LucideIcon>)[subject.icon] ??
                      Icons.BookOpen) as Icons.LucideIcon;
                    return (
                      <Link key={subject.id} href={`/subjects/${subject.id}`}>
                        <Card className="h-full hover:shadow-lg transition-all cursor-pointer border-border hover:border-primary/40 group overflow-hidden relative hover:-translate-y-0.5">
                          <div
                            className="absolute top-0 right-0 w-32 h-32 opacity-10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"
                            style={{ backgroundColor: subject.color }}
                          />
                          <CardContent className="p-5 flex flex-col h-full">
                            <div
                              className="w-11 h-11 rounded-xl flex items-center justify-center mb-3"
                              style={{ backgroundColor: `${subject.color}22`, color: subject.color }}
                            >
                              <SIcon className="w-5 h-5" />
                            </div>
                            <h3 className="text-lg font-bold text-foreground mb-1">
                              {subject.nameBn}
                            </h3>
                            <p className="text-xs text-muted-foreground mb-3 line-clamp-2 flex-1">
                              {subject.description}
                            </p>
                            <div className="flex items-center gap-3 text-xs font-medium text-muted-foreground mt-auto">
                              <div className="flex items-center gap-1">
                                <Icons.Layers className="w-3.5 h-3.5" />
                                <span>{subject.chapterCount}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Icons.HelpCircle className="w-3.5 h-3.5" />
                                <span>{subject.questionCount}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
