import { Router, type IRouter } from "express";
import { eq, asc } from "drizzle-orm";
import { db, conversations, messages } from "@workspace/db";
import { GoogleGenAI } from "@google/genai";
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
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();
const GEMINI_MODEL = "gemini-3.6-flash";

let geminiClient: GoogleGenAI | undefined;

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  geminiClient ??= new GoogleGenAI({ apiKey });
  return geminiClient;
}

async function getAiProvider() {
  const gemini = getGeminiClient();
  if (gemini) return { kind: "gemini" as const, client: gemini };

  if (
    !process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL ||
    !process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY
  ) {
    return null;
  }

  // Load the Replit-specific client only when Gemini is not configured.
  // Its module validates the integration env vars during import.
  const { anthropic } = await import("@workspace/integrations-anthropic-ai");
  return { kind: "anthropic" as const, client: anthropic };
}

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

router.get("/anthropic/conversations", requireAuth, async (req, res): Promise<void> => {
  const userId = req.session.userId!;
  const rows = await db
    .select()
    .from(conversations)
    .where(eq(conversations.userId, userId))
    .orderBy(asc(conversations.id));
  res.json(ListAnthropicConversationsResponse.parse(rows));
});

router.post("/anthropic/conversations", requireAuth, async (req, res): Promise<void> => {
  const userId = req.session.userId!;
  const parsed = CreateAnthropicConversationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [created] = await db
    .insert(conversations)
    .values({ userId, title: parsed.data.title })
    .returning();
  res.status(201).json({
    id: created.id,
    title: created.title,
    createdAt: created.createdAt,
  });
});

router.get("/anthropic/conversations/:id", requireAuth, async (req, res): Promise<void> => {
  const userId = req.session.userId!;
  const params = GetAnthropicConversationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [conv] = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, params.data.id));
  if (!conv || conv.userId !== userId) {
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

router.delete("/anthropic/conversations/:id", requireAuth, async (req, res): Promise<void> => {
  const userId = req.session.userId!;
  const params = DeleteAnthropicConversationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [conv] = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, params.data.id));
  if (!conv || conv.userId !== userId) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }
  await db.delete(conversations).where(eq(conversations.id, conv.id));
  res.sendStatus(204);
});

router.get("/anthropic/conversations/:id/messages", requireAuth, async (req, res): Promise<void> => {
  const userId = req.session.userId!;
  const params = ListAnthropicMessagesParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [conv] = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, params.data.id));
  if (!conv || conv.userId !== userId) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }
  const msgs = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, params.data.id))
    .orderBy(asc(messages.id));
  res.json(ListAnthropicMessagesResponse.parse(msgs));
});

router.post("/anthropic/conversations/:id/messages", requireAuth, async (req, res): Promise<void> => {
  const userId = req.session.userId!;
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

  const [conv] = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, params.data.id));
  if (!conv || conv.userId !== userId) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  let provider: Awaited<ReturnType<typeof getAiProvider>>;
  try {
    provider = await getAiProvider();
  } catch (err) {
    req.log.error({ err }, "AI provider initialization failed");
    res.status(503).json({ error: "AI সেবা এখন কনফিগার করা নেই।" });
    return;
  }
  if (!provider) {
    res.status(503).json({ error: "AI সেবা এখন কনফিগার করা নেই।" });
    return;
  }

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
    if (provider.kind === "gemini") {
      const stream = await provider.client.interactions.create({
        model: GEMINI_MODEL,
        input: chatMessages.map((message) => ({
          type: message.role === "assistant" ? ("model_output" as const) : ("user_input" as const),
          content: [{ type: "text" as const, text: message.content }],
        })),
        system_instruction: SYSTEM_PROMPT,
        stream: true,
        store: false,
      });

      for await (const event of stream) {
        if (event.event_type === "error") {
          throw new Error(event.error?.message ?? "Gemini streaming failed");
        }
        if (event.event_type === "step.delta" && event.delta.type === "text") {
          const text = event.delta.text;
          fullResponse += text;
          res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
        }
      }
    } else {
      const stream = provider.client.messages.stream({
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

/* ── Quick one-shot chat endpoint (used by test result & subject pages) ── */
router.post("/chat", async (req, res): Promise<void> => {
  const { message } = req.body as { message?: string };
  if (!message || typeof message !== "string") {
    res.status(400).json({ error: "message required" });
    return;
  }
  try {
    const provider = await getAiProvider();
    if (!provider) {
      res.status(503).json({ error: "AI সেবা এখন কনফিগার করা নেই।" });
      return;
    }

    let reply: string;
    if (provider.kind === "gemini") {
      const response = await provider.client.interactions.create({
        model: GEMINI_MODEL,
        input: message,
        system_instruction: SYSTEM_PROMPT,
        store: false,
      });
      reply = response.output_text ?? "";
    } else {
      const response = await provider.client.messages.create({
        model: "claude-sonnet-4-5",
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: message }],
      });
      reply = response.content
        .filter((block) => block.type === "text")
        .map((block) => block.text)
        .join("");
    }
    res.json({ reply });
  } catch (err) {
    req.log.error({ err }, "Quick chat failed");
    const status =
      typeof err === "object" && err !== null && "status" in err && err.status === 503
        ? 503
        : 500;
    res.status(status).json({ reply: "AI বিশ্লেষণ এখন পাওয়া যাচ্ছে না। আবার চেষ্টা করুন।" });
  }
});

export default router;
