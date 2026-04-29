import { useListChaptersBySubject, useListSubjects } from "@workspace/api-client-react";
import { Link, useRoute } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ChevronRight, PlayCircle, BookOpen } from "lucide-react";

export default function SubjectDetail() {
  const [, params] = useRoute("/subjects/:subjectId");
  const subjectId = Number(params?.subjectId);

  const { data: chapters, isLoading: chaptersLoading } = useListChaptersBySubject(subjectId, {
    query: { enabled: !!subjectId, queryKey: ["/api/subjects", subjectId, "chapters"] }
  });

  const { data: subjects } = useListSubjects();
  const subject = subjects?.find(s => s.id === subjectId);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/subjects" className="hover:text-foreground transition-colors">বিষয়সমূহ</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-foreground font-medium">{subject?.nameBn || "লোড হচ্ছে..."}</span>
        </div>
        
        {subject && (
          <div className="p-8 rounded-3xl bg-card border border-border shadow-sm flex flex-col md:flex-row gap-6 items-start md:items-center">
            <div 
              className="w-20 h-20 rounded-2xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${subject.color}20`, color: subject.color }}
            >
              <BookOpen className="w-10 h-10" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">{subject.nameBn}</h1>
              <p className="text-lg text-muted-foreground">{subject.description}</p>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          অধ্যায়সমূহ
          {chapters && <span className="text-sm font-normal px-2 py-1 bg-muted rounded-full text-muted-foreground">{chapters.length}</span>}
        </h2>
        
        {chaptersLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
          </div>
        ) : (
          <div className="grid gap-3">
            {chapters?.map((chapter) => (
              <Card key={chapter.id} className="overflow-hidden border-border hover:border-primary/30 transition-colors group">
                <CardContent className="p-0">
                  <div className="flex items-center justify-between p-4 md:p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-bold">
                        {chapter.orderIndex}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">{chapter.nameBn}</h3>
                        <p className="text-sm text-muted-foreground">{chapter.questionCount} টি প্রশ্ন</p>
                      </div>
                    </div>
                    <Link href={`/practice/${chapter.id}`}>
                      <Button variant="ghost" className="group-hover:bg-primary group-hover:text-primary-foreground rounded-full">
                        <PlayCircle className="w-5 h-5 mr-2" />
                        অনুশীলন
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
            {chapters?.length === 0 && (
              <div className="text-center py-12 bg-muted/30 rounded-2xl border border-dashed border-border">
                <p className="text-muted-foreground">এই বিষয়ে কোনো অধ্যায় নেই।</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
