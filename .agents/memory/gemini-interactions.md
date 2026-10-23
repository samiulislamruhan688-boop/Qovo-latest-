---
name: Gemini chat API
description: Model and endpoint selection lessons for Qovo's direct Google Gemini chat integration.
---

For Qovo's direct Gemini integration, check Google's current model and endpoint documentation before changing model IDs. Newer Gemini Flash models may require the Interactions API rather than the older `generateContent` endpoint. Keep PostgreSQL as the canonical conversation history, send those turns as interaction input, and disable provider-side storage when the full history is already stored locally.

**Why:** The older Gemini 2.0 Flash model was retired, and the provider recommended a newer Flash model on the Interactions API. The old endpoint did not return promptly for that newer model.

**How to apply:** Before selecting or upgrading a model, confirm its current endpoint in official Google docs. For multi-turn chat, map DB user/assistant turns to Interactions API `user_input`/`model_output` steps, stream only text deltas to the existing SSE contract, and set `store: false`.
