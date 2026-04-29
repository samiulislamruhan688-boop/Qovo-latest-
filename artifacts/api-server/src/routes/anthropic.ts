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

const SYSTEM_PROMPT = `তুমি "শিক্ষা AI" — একটি বন্ধুসুলভ এবং অভিজ্ঞ বাংলাদেশি শিক্ষার্থীর AI টিউটর। তুমি বাংলায় উত্তর দাও (সংজ্ঞা, সূত্র বা প্রযুক্তিগত শব্দে ইংরেজি ব্যবহার ঠিক আছে)। তোমার কাজ হলো:
- HSC, SSC, এডমিশন এবং অন্যান্য পরীক্ষার প্রস্তুতিতে সাহায্য করা
- যেকোনো বিষয়ের ধারণা সহজভাবে ব্যাখ্যা করা (পদার্থবিজ্ঞান, রসায়ন, গণিত, জীববিজ্ঞান, বাংলা, ইংরেজি, ICT, সাধারণ জ্ঞান)
- ধাপে ধাপে সমস্যা সমাধান দেখানো
- উদাহরণ ও বাস্তব জীবনের অ্যানালজি ব্যবহার করা
- শিক্ষার্থীকে উৎসাহিত করা — কঠোর সমালোচনা করো না

উত্তর সংক্ষিপ্ত ও পরিষ্কার রাখো। প্রয়োজনে markdown ব্যবহার করো (heading, list, code, math expressions)।

গুরুত্বপূর্ণ: কোনো ইমোজি বা ইউনিকোড emoji symbol (😊, 👋, 📚, ইত্যাদি) ব্যবহার করো না। শুধু সাধারণ টেক্সট, markdown ও বাংলা/ইংরেজি অক্ষর ব্যবহার করো।`;

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
