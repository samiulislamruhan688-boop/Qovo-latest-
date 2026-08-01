import { useGetProgressSummary, useGetProgressBySubject, useGetStreak } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Trophy, Target, Flame, Brain } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { useAuth } from "@/contexts/AuthContext";
import { SignInCard } from "@/components/auth/SignInCard";

export default function ProgressPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { data: summary, isLoading: loadingSummary } = useGetProgressSummary();
  const { data: subjectProgress, isLoading: loadingSubjects } = useGetProgressBySubject();
  const { data: streak, isLoading: loadingStreak } = useGetStreak();

  if (authLoading) {
    return (
      <div className="max-w-6xl mx-auto space-y-8">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </div>
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    );
  }

  if (!user) {
    return (
      <SignInCard message="Please sign in to save your progress, track your performance, and unlock AI analytics." />
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">আপনার প্রগতি</h1>
        <p className="text-muted-foreground">আপনার শেখার যাত্রা ও বিস্তারিত পরিসংখ্যান</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard 
          title="মোট পয়েন্ট" 
          value={summary?.totalPoints} 
          icon={<Trophy className="w-6 h-6 text-yellow-500" />} 
          loading={loadingSummary} 
        />
        <StatCard 
          title="বর্তমান লেভেল" 
          value={summary?.level} 
          icon={<Brain className="w-6 h-6 text-primary" />} 
          loading={loadingSummary} 
        />
        <StatCard 
          title="সঠিকতার হার" 
          value={summary ? `${Math.round(summary.accuracy)}%` : undefined} 
          icon={<Target className="w-6 h-6 text-green-500" />} 
          loading={loadingSummary} 
        />
        <StatCard 
          title="কারেন্ট স্ট্রাইক" 
          value={streak ? `${streak.currentStreak} দিন` : undefined} 
          icon={<Flame className="w-6 h-6 text-orange-500" />} 
          loading={loadingStreak} 
        />
      </div>

      <div className="grid md:grid-cols-[2fr_1fr] gap-6">
        {/* Subject Progress Chart */}
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle>বিষয়ভিত্তিক সঠিকতা</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingSubjects ? (
              <Skeleton className="h-[300px] w-full" />
            ) : subjectProgress && subjectProgress.length > 0 ? (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={subjectProgress} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="subjectNameBn" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      domain={[0, 100]}
                    />
                    <Tooltip 
                      cursor={{ fill: 'hsl(var(--muted)/0.5)' }}
                      contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', boxShadow: 'var(--shadow-md)' }}
                      formatter={(value: number) => [`${Math.round(value)}%`, 'সঠিকতা']}
                    />
                    <Bar 
                      dataKey="accuracy" 
                      fill="hsl(var(--primary))" 
                      radius={[4, 4, 0, 0]} 
                      barSize={40}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                পর্যাপ্ত ডেটা নেই
              </div>
            )}
          </CardContent>
        </Card>

        {/* Subject Breakdown Details */}
        <Card className="border-border shadow-sm overflow-hidden">
          <CardHeader>
            <CardTitle>বিষয়ভিত্তিক অগ্রগতি</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loadingSubjects ? (
              <div className="p-6 space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (
              <div className="divide-y divide-border">
                {subjectProgress?.map(sp => (
                  <div key={sp.subjectId} className="p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-foreground">{sp.subjectNameBn}</span>
                      <span className="text-sm font-medium">{Math.round(sp.accuracy)}%</span>
                    </div>
                    <Progress value={sp.accuracy} className="h-2" style={{ 
                      // @ts-ignore - hacking indicator color
                      '--primary': sp.color 
                    } as any} />
                    <div className="mt-2 text-xs text-muted-foreground flex justify-between">
                      <span>{sp.answered} টি উত্তর দিয়েছেন</span>
                      <span className="text-green-600 dark:text-green-400">{sp.correct} টি সঠিক</span>
                    </div>
                  </div>
                ))}
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
    <Card className="border-border shadow-sm">
      <CardContent className="p-6 flex flex-col items-center text-center">
        <div className="mb-3 p-3 bg-muted rounded-full">
          {icon}
        </div>
        <p className="text-sm text-muted-foreground font-medium mb-1">{title}</p>
        {loading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <p className="text-2xl font-bold text-foreground">{value ?? 0}</p>
        )}
      </CardContent>
    </Card>
  );
}
