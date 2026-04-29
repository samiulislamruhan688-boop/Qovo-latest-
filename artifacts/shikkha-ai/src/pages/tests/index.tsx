import { useListTests } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { FileText, Clock, HelpCircle, AlertCircle, PlayCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Tests() {
  const { data: tests, isLoading } = useListTests();

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <FileText className="w-8 h-8 text-primary" />
          মডেল টেস্ট
        </h1>
        <p className="text-muted-foreground">আপনার প্রস্তুতি যাচাই করতে মডেল টেস্ট দিন</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-48 rounded-2xl" />)}
        </div>
      ) : tests?.length === 0 ? (
        <div className="text-center py-20 bg-muted/30 rounded-3xl border border-dashed border-border">
          <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">কোনো টেস্ট পাওয়া যায়নি</h2>
          <p className="text-muted-foreground">শীঘ্রই নতুন মডেল টেস্ট যুক্ত করা হবে।</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tests?.map((test) => (
            <Card key={test.id} className="border-border shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
              <CardContent className="p-6 flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <Badge variant="outline" className="mb-2 text-primary border-primary/20 bg-primary/5">
                      {test.subjectName}
                    </Badge>
                    <h2 className="text-xl font-bold text-foreground">{test.titleBn}</h2>
                  </div>
                  <Badge variant={
                    test.difficulty === 'hard' ? 'destructive' : 
                    test.difficulty === 'medium' ? 'default' : 'secondary'
                  }>
                    {test.difficulty === 'hard' ? 'কঠিন' : 
                     test.difficulty === 'medium' ? 'মাঝারি' : 'সহজ'}
                  </Badge>
                </div>
                
                <p className="text-muted-foreground text-sm mb-6 flex-1">{test.description}</p>
                
                <div className="flex items-center gap-6 text-sm font-medium text-foreground mb-6">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>{test.durationMinutes} মিনিট</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-muted-foreground" />
                    <span>{test.questionCount} প্রশ্ন</span>
                  </div>
                </div>
                
                <Link href={`/tests/${test.id}`} className="mt-auto">
                  <Button className="w-full rounded-xl" size="lg">
                    <PlayCircle className="w-5 h-5 mr-2" /> টেস্ট শুরু করুন
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
