import { useListRecentAttempts } from "@workspace/api-client-react";
import { useRoute, Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Target, Clock, ArrowRight, CheckCircle2, XCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function TestResult() {
  const [, params] = useRoute("/tests/:testId/result");
  const testId = Number(params?.testId);

  const { data: attempts, isLoading } = useListRecentAttempts();
  
  // Find the most recent attempt for this test
  const attempt = attempts?.find(a => a.testId === testId);

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Skeleton className="h-64 w-full rounded-3xl" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="max-w-md mx-auto text-center py-20">
        <h2 className="text-2xl font-bold mb-4">ফলাফল পাওয়া যায়নি</h2>
        <Link href="/tests">
          <Button>টেস্ট তালিকায় ফিরে যান</Button>
        </Link>
      </div>
    );
  }

  const accuracyColor = attempt.accuracy >= 80 ? "text-green-500" : attempt.accuracy >= 50 ? "text-orange-500" : "text-destructive";

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <div className="w-24 h-24 mx-auto bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6">
          <Trophy className="w-12 h-12" />
        </div>
        <h1 className="text-4xl font-bold text-foreground">টেস্ট সম্পন্ন হয়েছে!</h1>
        <p className="text-xl text-muted-foreground">{attempt.testTitle}</p>
        <p className="text-sm text-muted-foreground">
          {formatDistanceToNow(new Date(attempt.completedAt), { addSuffix: true })}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border shadow-sm">
          <CardContent className="p-6 text-center">
            <p className="text-sm text-muted-foreground mb-2">স্কোর</p>
            <p className="text-3xl font-bold text-foreground">{attempt.score}<span className="text-xl text-muted-foreground">/{attempt.totalQuestions}</span></p>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border shadow-sm">
          <CardContent className="p-6 text-center">
            <p className="text-sm text-muted-foreground mb-2">সঠিকতা</p>
            <p className={`text-3xl font-bold ${accuracyColor}`}>{Math.round(attempt.accuracy)}%</p>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border shadow-sm">
          <CardContent className="p-6 text-center">
            <p className="text-sm text-muted-foreground mb-2">সঠিক</p>
            <p className="text-3xl font-bold text-green-500 flex items-center justify-center gap-2">
              <CheckCircle2 className="w-6 h-6" /> {attempt.score}
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border shadow-sm">
          <CardContent className="p-6 text-center">
            <p className="text-sm text-muted-foreground mb-2">ভুল</p>
            <p className="text-3xl font-bold text-destructive flex items-center justify-center gap-2">
              <XCircle className="w-6 h-6" /> {attempt.totalQuestions - attempt.score}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-center gap-4 pt-8">
        <Link href="/tests">
          <Button variant="outline" size="lg">অন্য টেস্ট দিন</Button>
        </Link>
        <Link href="/progress">
          <Button size="lg">প্রগতি দেখুন <ArrowRight className="ml-2 w-5 h-5" /></Button>
        </Link>
      </div>
    </div>
  );
}
