# Chapter 02 — Support Chat

**Build:** A browser chatbot for Tomato, a fictional food-ordering app.
**Learn:** Conversation history, follow-ups, ordered requests, and resetting a chat.

Unlike Chapter 01, each model call includes earlier successful messages and replies.

## Run

Requires Node.js 20+, npm, and the same provider settings as Chapter 01. Stop Chapter 01 first if both use port `8080`. From the repository root:

```bash
cd 02-customer-support-chat-server
npm ci
cp .env.example .env
```

Skip the copy if `.env` already exists. Fill in `NEPTUNE_API_KEY`, `NEPTUNE_BASE_URL`, and `NEPTUNE_MODEL` with your provider settings. Use the API base URL, without `/chat/completions`.

```bash
npm start
```

Open **http://localhost:8080** (or your configured `PORT`). No frontend build needed. Open the server address, not `public/index.html` directly.

1. Send: **My food order is late.**
2. Follow up: **Can I cancel it?** The model gets earlier messages as context.
3. Click **New chat** to clear the server conversation.

## Understand the code

Backend: [`src/server.js`](./src/server.js).

1. Load settings and create the model client.
2. Start `history` with a **system** message defining the support bot.
3. `POST /api/chat` validates plain text, copies history, and adds the new **user** message.
4. Send those messages to the model; save user message and **assistant** reply only after success.
5. `runInOrder()` queues chats and resets so they do not overlap.
6. `DELETE /api` resets history, keeping only the system message.

**Memory is an array, not training:** The server resends saved text every turn. Restarting loses it.

Frontend in [`public/`](./public/):

- `index.html`: message list, input, and buttons.
- `style.css`: layout, colors, and mobile styling.
- `chat.js`: uses `fetch()` to send/reset, displays replies as text, and keeps your draft if sending fails. API keys stay on the server.

## Check and practice

- Run `npm run check` for server/frontend syntax. This does not test live AI calls.
- Send only spaces: the page rejects them; the API returns `400`.
- Ask an unrelated question; see whether the bot stays on topic.
- Next exercises: limit history length, then add separate histories per session.

**Problems:** `400` = missing/plain-text input issue; `413` = body over `100kb`; `502` = model-call failure. Check provider settings, quota, and connectivity. If the page does not open, check that the server is running and the port matches.

## Limits

- **Shared history:** All callers share one conversation. New chat clears it for everyone. The queue does not create private sessions.
- **Refresh is not reset:** Refresh hides browser messages but leaves server history.
- **No real actions:** The bot cannot look up orders, issue refunds, or access policy documents. Answers can be wrong.
- **Growing cost:** History grows each turn; longer chats cost more and can exceed model context limits. Slow calls delay the queue.
- **Local demo only:** No authentication or rate limiting. Use fictional messages, keep keys private, and remember that text goes to your provider.

[Previous: Chapter 01](../01-basic-llm-call-server/README.md) · [All chapters](../README.md)
