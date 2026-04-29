import { useGetLeaderboard } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Medal, Star } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Leaderboard() {
  const { data: leaderboard, isLoading } = useGetLeaderboard();

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-4 py-8">
        <div className="w-20 h-20 mx-auto bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 rounded-full flex items-center justify-center shadow-lg shadow-yellow-500/20">
          <Trophy className="w-10 h-10" />
        </div>
        <h1 className="text-4xl font-bold text-foreground">লিডারবোর্ড</h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          শীর্ষ শিক্ষার্থীদের সাথে আপনার অবস্থান তুলনা করুন এবং আরও পয়েন্ট অর্জন করতে নিয়মিত অনুশীলন করুন।
        </p>
      </div>

      <Card className="border-border shadow-xl overflow-hidden bg-card/50 backdrop-blur-sm">
        <div className="grid grid-cols-[60px_1fr_100px_100px] md:grid-cols-[80px_1fr_120px_120px] gap-4 p-4 md:p-6 bg-muted/50 border-b border-border text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          <div className="text-center">র‍্যাংক</div>
          <div>শিক্ষার্থী</div>
          <div className="text-right">সঠিকতা</div>
          <div className="text-right">পয়েন্ট</div>
        </div>
        
        <CardContent className="p-0 divide-y divide-border/50">
          {isLoading ? (
            Array(10).fill(0).map((_, i) => (
              <div key={i} className="p-4 md:p-6 flex items-center gap-4">
                <Skeleton className="w-8 h-8 rounded-full" />
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))
          ) : (
            leaderboard?.map((entry) => (
              <div 
                key={entry.rank}
                className={cn(
                  "grid grid-cols-[60px_1fr_100px_100px] md:grid-cols-[80px_1fr_120px_120px] gap-4 p-4 md:p-6 items-center transition-colors hover:bg-muted/30",
                  entry.isCurrentUser ? "bg-primary/5 hover:bg-primary/10 border-l-4 border-l-primary" : ""
                )}
              >
                <div className="flex justify-center">
                  {entry.rank === 1 ? <Medal className="w-8 h-8 text-yellow-500 fill-yellow-500/20" /> :
                   entry.rank === 2 ? <Medal className="w-8 h-8 text-slate-400 fill-slate-400/20" /> :
                   entry.rank === 3 ? <Medal className="w-8 h-8 text-amber-700 fill-amber-700/20" /> :
                   <span className="font-bold text-lg text-muted-foreground">{entry.rank}</span>}
                </div>
                
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-inner"
                    style={{ backgroundColor: entry.avatarColor }}
                  >
                    {entry.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-foreground text-sm md:text-base flex items-center gap-2">
                      {entry.name}
                      {entry.isCurrentUser && <span className="px-2 py-0.5 bg-primary text-primary-foreground text-[10px] rounded-full">আপনি</span>}
                    </p>
                    <p className="text-xs text-muted-foreground">{entry.testsCompleted} টি টেস্ট সম্পন্ন</p>
                  </div>
                </div>
                
                <div className="text-right font-medium text-foreground">
                  {Math.round(entry.accuracy)}%
                </div>
                
                <div className="text-right font-bold text-primary flex justify-end items-center gap-1">
                  {entry.points} <Star className="w-4 h-4 fill-primary/20" />
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
