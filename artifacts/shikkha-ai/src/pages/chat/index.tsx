import { useState } from "react";
import { useListAnthropicConversations, useCreateAnthropicConversation, useDeleteAnthropicConversation } from "@workspace/api-client-react";
import { Link, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquarePlus, MessageCircle, Trash2, Bot } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function ChatList() {
  const { data: conversations, isLoading, refetch } = useListAnthropicConversations();
  const createMutation = useCreateAnthropicConversation();
  const deleteMutation = useDeleteAnthropicConversation();
  const [, setLocation] = useLocation();
  const [isDeleting, setIsDeleting] = useState<number | null>(null);

  const handleCreateNew = () => {
    createMutation.mutate({
      data: { title: "নতুন চ্যাট" }
    }, {
      onSuccess: (newConv) => {
        setLocation(`/chat/${newConv.id}`);
      }
    });
  };

  const handleDelete = (e: React.MouseEvent, id: number) => {
    e.preventDefault(); // Prevent navigating to chat
    if (window.confirm("আপনি কি এই চ্যাটটি মুছে ফেলতে চান?")) {
      setIsDeleting(id);
      deleteMutation.mutate({ id }, {
        onSuccess: () => {
          refetch();
          setIsDeleting(null);
        },
        onError: () => setIsDeleting(null)
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Bot className="w-8 h-8 text-primary" />
            এআই টিউটর
          </h1>
          <p className="text-muted-foreground mt-1">যেকোনো প্রশ্ন করুন, ব্যাখ্যা বুঝুন বা সমস্যা সমাধান করুন</p>
        </div>
        
        <Button onClick={handleCreateNew} disabled={createMutation.isPending} size="lg" className="rounded-full shadow-lg shadow-primary/20">
          <MessageSquarePlus className="w-5 h-5 mr-2" />
          {createMutation.isPending ? "তৈরি হচ্ছে..." : "নতুন চ্যাট"}
        </Button>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          [1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)
        ) : conversations?.length === 0 ? (
          <div className="text-center py-20 bg-muted/30 rounded-3xl border border-dashed border-border">
            <Bot className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h2 className="text-xl font-bold mb-2">কোনো চ্যাট নেই</h2>
            <p className="text-muted-foreground mb-6">আপনার এআই টিউটরের সাথে কথা বলা শুরু করুন।</p>
            <Button onClick={handleCreateNew} disabled={createMutation.isPending}>
              প্রথম চ্যাট শুরু করুন
            </Button>
          </div>
        ) : (
          conversations?.map((conv) => (
            <Link key={conv.id} href={`/chat/${conv.id}`}>
              <Card className="border-border hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <MessageCircle className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg text-foreground truncate">{conv.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(conv.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => handleDelete(e, conv.id)}
                    disabled={isDeleting === conv.id}
                  >
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
