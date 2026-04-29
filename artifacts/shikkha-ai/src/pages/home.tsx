import { 
  useGetProgressSummary, 
  useListRecentAttempts, 
  useGetActivityFeed,
  useGetStreak
} from "@workspace/api-client-react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Brain, Target, Trophy, Clock, ArrowRight, Flame } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function Home() {
  const { data: summary, isLoading: loadingSummary } = useGetProgressSummary();
  const { data: recentAttempts, isLoading: loadingAttempts } = useListRecentAttempts();
  const { data: activities, isLoading: loadingActivities } = useGetActivityFeed();

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-background to-secondary/10 border border-border/50 p-8 md:p-12">
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            স্বাগতম, শিক্ষার্থী!
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            আজকের লক্ষ্য নির্ধারণ করুন এবং আপনার প্রস্তুতি চালিয়ে যান। সম্পূর্ণ বিনামূল্যে।
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/subjects" className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
              পড়া শুরু করুন <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <Link href="/chat" className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-card text-foreground font-semibold border border-border hover:bg-accent hover:text-accent-foreground transition-colors shadow-sm">
              এআই টিউটরকে প্রশ্ন করুন
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Grid */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard 
          title="মোট পয়েন্ট" 
          value={summary?.totalPoints} 
          icon={<Trophy className="w-5 h-5 text-yellow-500" />} 
          loading={loadingSummary} 
        />
        <StatCard 
          title="সঠিক উত্তর" 
          value={summary?.totalCorrect} 
          icon={<Target className="w-5 h-5 text-green-500" />} 
          loading={loadingSummary} 
        />
        <StatCard 
          title="সঠিকতার হার" 
          value={summary ? `${Math.round(summary.accuracy)}%` : undefined} 
          icon={<Brain className="w-5 h-5 text-primary" />} 
          loading={loadingSummary} 
        />
        <StatCard 
          title="বর্তমান লেভেল" 
          value={summary?.level} 
          icon={<Flame className="w-5 h-5 text-orange-500" />} 
          loading={loadingSummary} 
        />
      </section>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <Card className="border-none shadow-md">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" /> সাম্প্রতিক কার্যক্রম
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingActivities ? (
              <div className="space-y-4">
                {[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
              </div>
            ) : activities?.length ? (
              <div className="space-y-4">
                {activities.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-border/50">
                    <div>
                      <p className="font-semibold text-foreground">{activity.title}</p>
                      <p className="text-sm text-muted-foreground">{activity.detail}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-primary">+{activity.points}</span>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(activity.createdAt))}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                এখনও কোনো কার্যক্রম নেই। পড়া শুরু করুন!
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Tests */}
        <Card className="border-none shadow-md">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <FileText className="w-5 h-5 text-secondary" /> সাম্প্রতিক মডেল টেস্ট
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingAttempts ? (
              <div className="space-y-4">
                {[1,2].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
              </div>
            ) : recentAttempts?.length ? (
              <div className="space-y-4">
                {recentAttempts.slice(0, 3).map((attempt) => (
                  <Link key={attempt.id} href={`/tests/${attempt.testId}/result`}>
                    <div className="group flex items-center justify-between p-4 rounded-xl bg-card border border-border hover:border-secondary transition-colors cursor-pointer">
                      <div>
                        <p className="font-bold text-foreground group-hover:text-secondary transition-colors">{attempt.testTitle}</p>
                        <p className="text-sm text-muted-foreground">
                          {Math.round(attempt.accuracy)}% সঠিক
                        </p>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="font-bold text-lg">{attempt.score}/{attempt.totalQuestions}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                এখনও কোনো টেস্ট দেননি। <Link href="/tests" className="text-primary hover:underline">টেস্ট দিন</Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, loading }: any) {
  return (
    <Card className="border-none shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-2 text-muted-foreground">
          {icon}
          <span className="font-medium text-sm">{title}</span>
        </div>
        {loading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <div className="text-2xl md:text-3xl font-bold text-foreground">{value ?? 0}</div>
        )}
      </CardContent>
    </Card>
  );
}

import { FileText } from "lucide-react";
