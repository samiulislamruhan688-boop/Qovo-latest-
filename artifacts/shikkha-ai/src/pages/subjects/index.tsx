import { useListSubjects } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import * as Icons from "lucide-react";

export default function Subjects() {
  const { data: subjects, isLoading } = useListSubjects();

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-foreground">সকল বিষয়</h1>
        <p className="text-muted-foreground">আপনার প্রস্তুতির জন্য যেকোনো বিষয় বেছে নিন</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects?.map((subject) => {
            // @ts-ignore
            const Icon = Icons[subject.icon] || Icons.BookOpen;
            return (
              <Link key={subject.id} href={`/subjects/${subject.id}`}>
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer border-border hover:border-primary/50 group overflow-hidden relative">
                  <div 
                    className="absolute top-0 right-0 w-32 h-32 opacity-10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"
                    style={{ backgroundColor: subject.color }}
                  />
                  <CardContent className="p-6 flex flex-col h-full">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                      style={{ backgroundColor: `${subject.color}20`, color: subject.color }}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <h2 className="text-xl font-bold text-foreground mb-1">{subject.nameBn}</h2>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2 flex-1">{subject.description}</p>
                    <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground mt-auto">
                      <div className="flex items-center gap-1">
                        <Icons.BookOpen className="w-4 h-4" />
                        <span>{subject.chapterCount} অধ্যায়</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Icons.HelpCircle className="w-4 h-4" />
                        <span>{subject.questionCount} প্রশ্ন</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
