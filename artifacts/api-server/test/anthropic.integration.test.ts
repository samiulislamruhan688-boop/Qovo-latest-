import assert from "node:assert/strict";
import { once } from "node:events";
import { randomUUID } from "node:crypto";
import { after, test } from "node:test";
import express from "express";
import session from "express-session";
import type { Server } from "node:http";
import { eq } from "drizzle-orm";
import { conversations, db, messages, pool, users } from "@workspace/db";
import {
  createAnthropicChatRouter,
  type AiProviderResolver,
} from "../src/routes/anthropic";
import apiRouter from "../src/routes";

const firstReplyChunks = ["Saved ", "assistant reply."];
const secondReplyChunks = ["Second ", "turn reply."];
const providerCalls: Array<Record<string, unknown>> = [];
let streamCallCount = 0;
let server: Server | undefined;
let testUserId: number | undefined;

const fakeGeminiClient = {
  interactions: {
    async create(options: Record<string, unknown>) {
      providerCalls.push(options);
      if (options.stream) {
        const chunks = streamCallCount++ === 0 ? firstReplyChunks : secondReplyChunks;
        return (async function* () {
          for (const text of chunks) {
            yield {
              event_type: "step.delta",
              delta: { type: "text", text },
            };
          }
        })();
      }
      return { output_text: "One-shot reply" };
    },
  },
};

const fakeProviderResolver: AiProviderResolver = async () =>
  ({
    kind: "gemini",
    client: fakeGeminiClient,
  }) as unknown as Awaited<ReturnType<AiProviderResolver>>;

function parseSseEvents(body: string): unknown[] {
  return body
    .trim()
    .split("\n\n")
    .map((frame) => {
      assert.ok(frame.startsWith("data: "), `Unexpected SSE frame: ${frame}`);
      return JSON.parse(frame.slice("data: ".length));
    });
}

after(async () => {
  if (server?.listening) {
    await new Promise<void>((resolve, reject) => {
      server!.close((error) => (error ? reject(error) : resolve()));
    });
  }
  if (testUserId !== undefined) {
    await db.delete(users).where(eq(users.id, testUserId));
  }
  await pool.end();
});

test("authenticated chat streams, persists once, reuses history, and keeps one-shot JSON shape", async () => {
  const testApp = express();
  testApp.use(express.json());
  testApp.use(
    session({
      name: "qovo.sid",
      secret: "test-only-session-signing-key",
      resave: false,
      saveUninitialized: false,
    }),
  );

  const uniqueId = randomUUID();
  const [user] = await db
    .insert(users)
    .values({
      googleId: `chat-integration-${uniqueId}`,
      email: `chat-integration-${uniqueId}@example.invalid`,
      name: "Chat integration test",
    })
    .returning({ id: users.id });
  testUserId = user.id;

  testApp.post("/test/session", (req, res) => {
    req.session.userId = user.id;
    res.sendStatus(204);
  });
  testApp.use("/api", createAnthropicChatRouter(fakeProviderResolver));
  testApp.use("/api", apiRouter);

  server = testApp.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const baseUrl = `http://127.0.0.1:${address.port}`;

  const loginResponse = await fetch(`${baseUrl}/test/session`, { method: "POST" });
  assert.equal(loginResponse.status, 204);
  const setCookie = loginResponse.headers.get("set-cookie");
  assert.ok(setCookie, "test login should establish an authenticated session");
  const cookie = setCookie.split(";")[0];

  const unauthenticatedResponse = await fetch(
    `${baseUrl}/api/anthropic/conversations`,
  );
  assert.equal(unauthenticatedResponse.status, 401);

  const createConversationResponse = await fetch(
    `${baseUrl}/api/anthropic/conversations`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ title: "Integration test conversation" }),
    },
  );
  assert.equal(createConversationResponse.status, 201);
  const conversation = (await createConversationResponse.json()) as { id: number };

  const firstTurn = await fetch(
    `${baseUrl}/api/anthropic/conversations/${conversation.id}/messages`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ content: "First question" }),
    },
  );
  assert.equal(firstTurn.status, 200);
  assert.match(firstTurn.headers.get("content-type") ?? "", /^text\/event-stream/);
  assert.deepEqual(parseSseEvents(await firstTurn.text()), [
    { content: firstReplyChunks[0] },
    { content: firstReplyChunks[1] },
    { done: true },
  ]);

  const savedAfterFirstTurn = await fetch(
    `${baseUrl}/api/anthropic/conversations/${conversation.id}/messages`,
    { headers: { Cookie: cookie } },
  );
  assert.equal(savedAfterFirstTurn.status, 200);
  const firstHistory = (await savedAfterFirstTurn.json()) as Array<{
    role: string;
    content: string;
  }>;
  assert.deepEqual(
    firstHistory.map(({ role, content }) => ({ role, content })),
    [
      { role: "user", content: "First question" },
      { role: "assistant", content: firstReplyChunks.join("") },
    ],
  );
  assert.equal(
    firstHistory.filter(
      ({ role, content }) => role === "assistant" && content === firstReplyChunks.join(""),
    ).length,
    1,
  );

  const secondTurn = await fetch(
    `${baseUrl}/api/anthropic/conversations/${conversation.id}/messages`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ content: "Second question" }),
    },
  );
  assert.equal(secondTurn.status, 200);
  assert.deepEqual(parseSseEvents(await secondTurn.text()), [
    { content: secondReplyChunks[0] },
    { content: secondReplyChunks[1] },
    { done: true },
  ]);

  const secondTurnInput = providerCalls[1].input as Array<{
    type: string;
    content: Array<{ text: string }>;
  }>;
  assert.deepEqual(
    secondTurnInput.map(({ type, content }) => ({
      type,
      text: content[0]?.text,
    })),
    [
      { type: "user_input", text: "First question" },
      { type: "model_output", text: firstReplyChunks.join("") },
      { type: "user_input", text: "Second question" },
    ],
  );

  const quickReplyResponse = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: "Quick question" }),
  });
  assert.equal(quickReplyResponse.status, 200);
  assert.deepEqual(await quickReplyResponse.json(), { reply: "One-shot reply" });

  const finalHistory = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversation.id));
  assert.equal(
    finalHistory.filter(
      ({ role, content }) => role === "assistant" && content === firstReplyChunks.join(""),
    ).length,
    1,
  );
  assert.equal(finalHistory.filter(({ role }) => role === "assistant").length, 2);

  await db.delete(conversations).where(eq(conversations.id, conversation.id));
});
