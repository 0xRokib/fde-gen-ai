# Chapter 02: Customer Support Chat Server

Build a chatbot for **Tomato**, a fictional food-ordering app. It answers support questions and remembers earlier messages while the server runs.

**You will learn:** conversation history, message roles, ordered requests, and resetting a chat. All code is in [`src/server.js`](./src/server.js).

## How this builds on Chapter 01

- **01:** summarize one ticket with `POST /api/summarize`. Each request is independent.
- **02:** answer a customer with `POST /api/chat`. Each call includes earlier successful messages and replies.
- **Both:** use your `NEPTUNE_` settings, the OpenAI SDK's Chat Completions API, plain text, and one server file.

Unlike the reference example, Chapter 02 uses Chat Completions rather than the Responses API so it follows Chapter 01's provider setup. Compatibility still depends on your provider.

## 1. Setup

You need Node.js 20+, npm, and the same provider settings as Chapter 01.

From the repository root:

```bash
cd 02-customer-support-chat-server
npm ci
cp ../01-basic-llm-call-server/.env .env
```

Skip the copy if this lesson already has a configured `.env`; copying replaces it. If Chapter 01 has no `.env`, copy `.env.example` instead and fill in:

```dotenv
NEPTUNE_API_KEY=replace-with-your-key
NEPTUNE_BASE_URL=https://your-provider.example/v1
NEPTUNE_MODEL=your-model-id
PORT=8080
```

The key, base URL, and model come from your provider. Do not append `/chat/completions` to the base URL. Stop Chapter 01 before using the same port, or change `PORT` and the request URLs below.

## 2. Run, chat, and reset

```bash
npm start
```

Default address: `http://localhost:8080`. Use `npm run dev` for automatic restarts. In another terminal, send plain text:

```bash
curl -X POST http://localhost:8080/api/chat \
  -H 'Content-Type: text/plain' \
  --data 'My food order is late. What should I do?'
```

Send a follow-up:

```bash
curl -X POST http://localhost:8080/api/chat \
  -H 'Content-Type: text/plain' \
  --data 'Can I cancel it?'
```

The model receives the earlier conversation, giving it context for “it.” Replies are plain text; wording and accuracy vary by model.

Start a new conversation:

```bash
curl -i -X DELETE http://localhost:8080/api
```

Expected: `200 OK`, empty body. The next message has no earlier history.

Opening `/` in a browser will not show a website. On Windows PowerShell, use `Copy-Item` instead of `cp`, and `curl.exe` with requests on one line.

## 3. How the code works

1. Load and validate `.env`, then create the provider client and Express app.
2. Read a `text/plain` body, up to `100kb`; reject blank or non-text input.
3. `runInOrder(operation)` waits for earlier chat/reset work to finish.
4. `getChatReply(message)` sends the system prompt, history, and new message to the model.
5. Read the reply and save both messages only after success.
6. Return the reply as plain text. Express 5 forwards async errors to the shared error handler.

### What is history?

`history` is an array in server memory. On a follow-up, the model receives messages shaped like this:

```js
[
  { role: "system", content: SYSTEM_PROMPT },
  { role: "user", content: "My food order is late." },
  { role: "assistant", content: "An example support reply..." },
  { role: "user", content: "Can I cancel it?" }
]
```

`system` gives instructions, `user` is the customer, and `assistant` is the model. `...history` inserts earlier messages. This is **not model training or a database**: the server resends saved text each time. Restarting or resetting clears it.

### Why a queue?

A queue is a waiting line. Processing one operation at a time keeps simultaneous chats from mixing turn order and prevents resets during an active model call. Failed calls do not change history or block later work.

**All callers still share one conversation.** The queue keeps order; it does not create private customer sessions.

## 4. Checks and common problems

Check syntax:

```bash
npm run check
```

With the server running, check blank-input rejection without calling the model:

```bash
curl -i -X POST http://localhost:8080/api/chat \
  -H 'Content-Type: text/plain' \
  --data ' '
```

Expected: `400` with `Message text is required.` There is no automated test suite. Valid chat examples call your provider and may cost money; syntax checks do not verify provider compatibility.

- **Missing settings:** fill in `.env` and run from this lesson's folder.
- **`EADDRINUSE`:** stop Chapter 01 or change `PORT`.
- **`400`:** send non-empty plain text, not JSON.
- **`413`:** the request body exceeds `100kb`.
- **`502`:** check the provider key, URL, model, quota, and connectivity. Internal errors are intentionally hidden.

## Try it yourself

1. Send an unrelated question. Does the model stay on topic?
2. Limit history length to reduce token usage and cost.
3. Add separate histories per session so customers do not share messages.

## Safety and limitations

Keep this localhost-only demo local. It has no authentication or rate limiting, and any caller can clear the shared history. Use fictional messages; text goes to your provider. Keep credentials in ignored `.env` files.

History grows without a conversation limit, increasing cost and eventually risking model context limits. A slow model call delays every queued operation.

The model cannot access real orders, issue refunds, or look up company policies. Prompts guide behavior but do not guarantee correct answers or prevent all prompt injection. No database, browser interface, or streaming is included.

[Back to the learning index](../README.md)
