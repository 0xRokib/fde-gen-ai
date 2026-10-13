# Chapter 02 — A Chatbot with Conversation History

Build a browser support chatbot for Tomato, a fictional food-ordering app.

Chapter 01 sent one ticket per model call. This chapter sends earlier messages too, so the model has context for follow-up questions. You will connect the browser to your API, save conversation history, queue requests, and reset the chat.

## 1. Set up and run

You need Node.js 20+, npm, and the same kind of provider settings as Chapter 01. Stop Chapter 01 with `Ctrl+C` first if both use port `8080`.

From the repository root:

```bash
cd 02-customer-support-chat-server
npm ci
cp .env.example .env
```

Skip the copy if `.env` is already configured. Fill in your provider settings:

```dotenv
NEPTUNE_API_KEY=your-secret-key
NEPTUNE_BASE_URL=https://your-provider.example/v1
NEPTUNE_MODEL=your-model-id
PORT=8080
```

Use the API base URL without `/chat/completions`. You can use the same values as Chapter 01. Keys stay on the server, not in browser code.

```bash
npm start
```

Open **http://localhost:8080** (or your configured port). Keep the terminal running. Open this server address, not `public/index.html` directly: the page needs the API. No frontend build or separate server is needed.

Use `npm run dev` for automatic server restarts while editing.

## 2. Try a conversation

1. Send **My food order is late.**
2. Wait for the reply, then send **Can I cancel it?**
3. Click **New chat**, then ask **What problem did I mention?**

The model receives earlier turns with the second message, so it can interpret “it” as your order. Reset removes those turns from later calls. Exact replies vary by model.

The bot has no real order data, refund tools, or company policy documents. It can suggest contacting support, but cannot look up your order or issue a refund.

## 3. Understand conversation memory

Open [`src/server.js`](./src/server.js). The `history` array starts with a system message defining the bot's role and boundaries.

On the second turn, the model receives messages shaped like this:

```js
[
  { role: "system", content: "You are a customer-support agent for Tomato..." },
  { role: "user", content: "My food order is late." },
  { role: "assistant", content: "An earlier support reply..." },
  { role: "user", content: "Can I cancel it?" },
]
```

- **`system`:** instructions for the bot.
- **`user`:** customer's messages.
- **`assistant`:** model's earlier replies.

The server stores messages in memory and resends them on each call. This does not train the model. Restarting the server clears the conversation; there is no database.

## 4. Follow a request through the backend

### A. Validate and prepare

`POST /api/chat` accepts nonempty plain text, up to `100kb`. Invalid input returns `400` before calling the model.

The route queues `getReply(message)`, which prepares the model request:

```js
const messages = history.slice();
messages.push({ role: "user", content: message });
```

`slice()` creates a copy. Adding a new message to that copy does not yet change saved history.

### B. Call the model and save successful turns

```js
const aiResponse = await client.chat.completions.create({
  model: model,
  messages: messages,
});
```

After reading and checking the first reply, the server saves both sides:

```js
history.push({ role: "user", content: message });
history.push({ role: "assistant", content: reply });
```

If the call fails or returns an empty reply, saved history stays unchanged. Successful replies return as plain text. Express 5 forwards async failures to the shared error handler.

### C. Keep operations in order

`runInOrder()` queues chat and reset operations. Each operation finishes before the next begins, so overlapping requests cannot save turns out of order or reset history during a model call. Catching a failure keeps later requests from getting stuck.

All callers still share the same history. A slow call delays everyone behind it.

### D. Reset the chat

`DELETE /api` runs this through the same queue:

```js
history.length = 1;
```

The system prompt remains as the first item. Reset removes customer messages and model replies, then returns `200` with an empty body.

## 5. Connect the browser

The server serves both the API and files in [`public/`](./public/):

- **`index.html`:** chat messages, text input, and buttons.
- **`style.css`:** layout, colors, and small-screen styling.
- **`chat.js`:** browser interactions and API requests.

When you submit a message, `chat.js` uses:

```js
const response = await fetch("/api/chat", {
  method: "POST",
  headers: { "Content-Type": "text/plain" },
  body: message,
});
```

`fetch()` makes an HTTP request. The relative URL uses the same server that served the page. `response.text()` reads the reply; `response.ok` checks whether the request succeeded.

The page disables input and buttons while waiting. On success, it displays the reply and clears the input. On failure, it keeps your draft for retry. Messages use `textContent`, so replies display as text rather than HTML.

**New chat** calls `DELETE /api` and clears visible messages after success. Refreshing the page clears visible messages but leaves server history intact.

## 6. Check and experiment

Check server and browser JavaScript syntax:

```bash
npm run check
```

Try these checks with the server running:

- Send a message and a follow-up; confirm both replies appear.
- Click **New chat**; confirm visible messages clear.
- Send only spaces; the page should reject them without a model call.

To test blank-input rejection directly:

```bash
curl -i -X POST http://localhost:8080/api/chat \
  -H 'Content-Type: text/plain' \
  --data ' '
```

Expect `400` and `Message text is required.` No automated test suite is included. Syntax checks do not test AI behavior; valid messages call your provider and may cost money.

Exercises:

1. Change one tone instruction in the system prompt and compare replies.
2. Ask an unrelated question. Does the bot follow its topic restriction?
3. Limit saved history while preserving the system prompt and complete turns.
4. Give each session its own history.

**Check your understanding:** Why save assistant replies too? Why copy history before calling the model? Does the queue create separate customer conversations? What is the difference between refresh and reset?

## Troubleshooting and limits

- **Page won't open:** keep the server running and check the port.
- **Startup error:** check `.env` and run from this chapter's folder.
- **`EADDRINUSE`:** stop the other server or change `PORT`.
- **`400`:** API expects nonempty plain text, not JSON.
- **`413`:** request body exceeds `100kb`.
- **`502`:** check provider key, URL, model, quota, and connectivity.

All callers share one conversation, and any caller can reset it. The server resends the growing history on each turn, which increases token usage and cost. Eventually, it can exceed the model's context limit. Prompts cannot guarantee correct answers or prevent all prompt injection.

Keep this localhost-only demo local. It has no authentication or rate limiting. Use fictional messages and keep API keys private; your provider receives the conversation text.

[Previous: Chapter 01](../01-basic-llm-call-server/README.md) · [Next: Chapter 03](../03-tool-calling-chat-server/README.md) · [All chapters](../README.md)
