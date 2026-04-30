import { Router, type IRouter } from "express";
import { eq, asc } from "drizzle-orm";
import { db, conversations, messages } from "@workspace/db";
import { anthropic } from "@workspace/integrations-anthropic-ai";
import {
  CreateAnthropicConversationBody,
  GetAnthropicConversationParams,
  DeleteAnthropicConversationParams,
  ListAnthropicMessagesParams,
  SendAnthropicMessageParams,
  SendAnthropicMessageBody,
  ListAnthropicConversationsResponse,
  GetAnthropicConversationResponse,
  ListAnthropicMessagesResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const SYSTEM_PROMPT = `তুমি "Qovo টিউটর" — বাংলাদেশের SSC শিক্ষার্থীদের একজন বন্ধুসুলভ, প্রাণবন্ত এবং অভিজ্ঞ AI টিউটর। তুমি বাংলায় উত্তর দাও (সংজ্ঞা, সূত্র বা প্রযুক্তিগত শব্দে ইংরেজি ব্যবহার ঠিক আছে)।

🎯 তোমার কাজ:
- SSC সিলেবাসের যেকোনো বিষয়ে সাহায্য করা — বাংলা, ইংরেজি, গণিত, পদার্থবিজ্ঞান, রসায়ন, জীববিজ্ঞান, উচ্চতর গণিত, হিসাববিজ্ঞান, ব্যবসায় উদ্যোগ, ফিন্যান্স, ভূগোল, অর্থনীতি, পৌরনীতি, ICT, ধর্মীয় শিক্ষা, বাংলাদেশ ও বিশ্বপরিচয়
- জটিল ধারণা সহজ ভাষায় ও বাস্তব জীবনের উদাহরণ দিয়ে বুঝিয়ে দেওয়া
- ধাপে ধাপে সমস্যা সমাধান দেখানো
- শিক্ষার্থীকে উৎসাহিত করা ও আত্মবিশ্বাস বাড়ানো

✨ লেখার স্টাইল:
- প্রাণবন্ত ও বন্ধুসুলভ টোন — যেন একজন বড় ভাই/আপু বুঝিয়ে দিচ্ছে
- উপযুক্ত জায়গায় ইমোজি ব্যবহার করো (📚 📝 🎯 ✨ 💡 🔬 ⚡ 🧪 ✅ ⭐ 🚀 ইত্যাদি) — তবে অতিরিক্ত নয়
- Markdown ব্যবহার করো: **bold**, *italic*, \`code\`, headings (## ###), bullet lists, numbered lists, tables, blockquotes, math (LaTeX-style $E=mc^2$)
- জটিল উত্তরে structured layout: heading → key points (bullets) → example → summary
- উত্তর হোক সংক্ষিপ্ত কিন্তু পূর্ণাঙ্গ — অপ্রয়োজনীয় ভূমিকা এড়াও`;

router.get("/anthropic/conversations", async (_req, res): Promise<void> => {
  const rows = await db.select().from(conversations).orderBy(asc(conversations.id));
  res.json(ListAnthropicConversationsResponse.parse(rows));
});

router.post("/anthropic/conversations", async (req, res): Promise<void> => {
  const parsed = CreateAnthropicConversationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [created] = await db.insert(conversations).values({ title: parsed.data.title }).returning();
  res.status(201).json({
    id: created.id,
    title: created.title,
    createdAt: created.createdAt,
  });
});

router.get("/anthropic/conversations/:id", async (req, res): Promise<void> => {
  const params = GetAnthropicConversationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [conv] = await db.select().from(conversations).where(eq(conversations.id, params.data.id));
  if (!conv) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }
  const msgs = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conv.id))
    .orderBy(asc(messages.id));
  res.json(
    GetAnthropicConversationResponse.parse({
      id: conv.id,
      title: conv.title,
      createdAt: conv.createdAt,
      messages: msgs,
    }),
  );
});

router.delete("/anthropic/conversations/:id", async (req, res): Promise<void> => {
  const params = DeleteAnthropicConversationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [deleted] = await db
    .delete(conversations)
    .where(eq(conversations.id, params.data.id))
    .returning();
  if (!deleted) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }
  res.sendStatus(204);
});

router.get("/anthropic/conversations/:id/messages", async (req, res): Promise<void> => {
  const params = ListAnthropicMessagesParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const msgs = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, params.data.id))
    .orderBy(asc(messages.id));
  res.json(ListAnthropicMessagesResponse.parse(msgs));
});

router.post("/anthropic/conversations/:id/messages", async (req, res): Promise<void> => {
  const params = SendAnthropicMessageParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = SendAnthropicMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [conv] = await db.select().from(conversations).where(eq(conversations.id, params.data.id));
  if (!conv) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  // Save user message
  await db.insert(messages).values({
    conversationId: conv.id,
    role: "user",
    content: parsed.data.content,
  });

  const history = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conv.id))
    .orderBy(asc(messages.id));

  const chatMessages = history.map((m) => ({
    role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
    content: m.content,
  }));

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  let fullResponse = "";

  try {
    const stream = anthropic.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: 8192,
      system: SYSTEM_PROMPT,
      messages: chatMessages,
    });

    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        fullResponse += event.delta.text;
        res.write(`data: ${JSON.stringify({ content: event.delta.text })}\n\n`);
      }
    }

    await db.insert(messages).values({
      conversationId: conv.id,
      role: "assistant",
      content: fullResponse,
    });

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    req.log.error({ err }, "AI streaming failed");
    res.write(`data: ${JSON.stringify({ error: "AI সেবায় সমস্যা হয়েছে। আবার চেষ্টা করুন।" })}\n\n`);
    res.end();
  }
});

export default router;
