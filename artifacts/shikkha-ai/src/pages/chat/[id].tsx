import { useState, useRef, useEffect } from "react";
import { useGetAnthropicConversation, getGetAnthropicConversationQueryKey } from "@workspace/api-client-react";
import { useRoute, Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Bot, User, Send, ChevronLeft, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

const SUGGESTIONS = [
  "একটা ম্যাথ সমস্যা সমাধান করো",
  "পদার্থবিজ্ঞানের একটি ধারণা ব্যাখ্যা কর",
  "ইংরেজি গ্রামারের রুলস বুঝিয়ে দাও",
  "পরীক্ষার জন্য একটি স্টাডি প্ল্যান তৈরি করো"
];

export default function Chat() {
  const [, params] = useRoute("/chat/:conversationId");
  const conversationId = Number(params?.conversationId);
  const queryClient = useQueryClient();

  const { data: conversation, isLoading } = useGetAnthropicConversation(conversationId, {
    query: { enabled: !!conversationId, queryKey: getGetAnthropicConversationQueryKey(conversationId) }
  });

  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedContent, setStreamedContent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation?.messages, streamedContent]);

  const handleSend = async (content: string = input) => {
    if (!content.trim() || isStreaming || !conversationId) return;

    setInput("");
    setIsStreaming(true);
    setStreamedContent("");

    // Optimistically add user message to UI via cache
    const queryKey = getGetAnthropicConversationQueryKey(conversationId);
    const oldData = queryClient.getQueryData<any>(queryKey);
    if (oldData) {
      queryClient.setQueryData(queryKey, {
        ...oldData,
        messages: [
          ...oldData.messages,
          { id: Date.now(), role: "user", content, createdAt: new Date().toISOString() }
        ]
      });
    }

    try {
      const res = await fetch(`/api/anthropic/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content })
      });

      if (!res.ok) throw new Error("Failed to send message");
      
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No reader");
      
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n\n");
          
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.done) {
                  // Stream finished
                } else if (data.content) {
                  setStreamedContent(prev => prev + data.content);
                }
              } catch (e) {
                // Ignore parse errors for incomplete chunks
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Streaming error:", error);
    } finally {
      setIsStreaming(false);
      setStreamedContent("");
      // Refetch to get the official message list from DB
      queryClient.invalidateQueries({ queryKey });
    }
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-6rem)]">
      <div className="flex items-center gap-4 mb-6 shrink-0">
        <Link href="/chat">
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:bg-muted">
            <ChevronLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Bot className="w-6 h-6 text-primary" />
          {conversation?.title || "এআই টিউটর"}
        </h1>
      </div>

      <Card className="flex-1 border-border shadow-sm overflow-hidden flex flex-col bg-card/50 backdrop-blur-sm">
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-20 w-3/4 rounded-2xl rounded-tl-sm ml-auto" />
              <Skeleton className="h-32 w-3/4 rounded-2xl rounded-tr-sm" />
            </div>
          ) : conversation?.messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6">
                <Bot className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-bold mb-2">কীভাবে সাহায্য করতে পারি?</h2>
              <p className="text-muted-foreground mb-8 max-w-md">
                আমি আপনার এআই স্টাডি বাডি। যেকোনো বিষয়ের উপর প্রশ্ন করতে পারেন।
              </p>
              
              <div className="grid sm:grid-cols-2 gap-3 w-full max-w-2xl">
                {SUGGESTIONS.map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(suggestion)}
                    className="p-4 rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-muted/50 text-left transition-all text-sm font-medium flex items-start gap-3 group"
                  >
                    <Lightbulb className="w-5 h-5 text-amber-500 shrink-0 group-hover:scale-110 transition-transform" />
                    <span>{suggestion}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {conversation?.messages.map((msg, i) => (
                <MessageBubble key={msg.id || i} role={msg.role} content={msg.content} />
              ))}
              {isStreaming && (
                <MessageBubble role="assistant" content={streamedContent} isStreaming />
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        <div className="p-4 bg-card border-t border-border">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="flex items-center gap-2 max-w-4xl mx-auto"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="আপনার প্রশ্ন লিখুন..."
              className="flex-1 rounded-full h-12 px-6 bg-muted/50 border-border focus-visible:ring-primary"
              disabled={isStreaming}
            />
            <Button 
              type="submit" 
              size="icon" 
              className="h-12 w-12 rounded-full shrink-0 shadow-sm"
              disabled={!input.trim() || isStreaming}
            >
              <Send className="w-5 h-5 ml-1" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}

function MessageBubble({ role, content, isStreaming }: { role: string, content: string, isStreaming?: boolean }) {
  const isUser = role === "user";
  
  return (
    <div className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}>
      <div className={cn("flex gap-3 max-w-[85%] md:max-w-[75%]", isUser ? "flex-row-reverse" : "flex-row")}>
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1",
          isUser ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground"
        )}>
          {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
        </div>
        
        <div className={cn(
          "px-5 py-3.5 text-[15px] leading-relaxed",
          isUser 
            ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-sm" 
            : "bg-muted border border-border text-foreground rounded-2xl rounded-tl-sm"
        )}>
          {content ? (
            <div className="whitespace-pre-wrap">{content}</div>
          ) : isStreaming ? (
            <div className="flex items-center gap-1 h-6">
              <span className="w-2 h-2 bg-foreground/30 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-foreground/30 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-foreground/30 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
