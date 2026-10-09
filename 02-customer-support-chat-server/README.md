# Chapter 02: Customer Support Chat Server

Build a chatbot for **Tomato**, a fictional food-ordering app. It answers support questions and remembers earlier messages while the server runs.

**You will learn:** conversation history, message roles, ordered requests, resetting a chat, and connecting a plain browser frontend. Server code is in [`src/server.js`](./src/server.js); frontend files are in [`public/`](./public/).

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

Open `http://localhost:8080` in your browser to use the chat page. If you changed `PORT`, use that port instead. Type a message and click **Send message**. **New chat** clears the shared server conversation. No frontend framework or build step is needed.

Keep the terminal running while you use the page. To stop the server, press `Ctrl+C` in that terminal. Open the localhost address, not `public/index.html` directly: the page needs the running server to send messages.

The frontend has three files:

- `public/index.html`: the message list, text box, and buttons.
- `public/style.css`: the page layout and colors.
- `public/chat.js`: sends plain text to `POST /api/chat` and resets with `DELETE /api` using `fetch()`.

The server serves the page and API from the same address, so JavaScript uses `/api/chat` without a hardcoded port. Credentials stay on the server. Messages are displayed as text, not HTML.

Use `npm run dev` for automatic restarts. You can also send plain text from another terminal:

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

On Windows PowerShell, use `Copy-Item` instead of `cp`, and `curl.exe` with requests on one line.

## 3. How the code works

1. Load and validate `.env`, then create the provider client and Express app.
2. Read a `text/plain` body, up to `100kb`; reject blank or non-text input.
3. `runInOrder(operation)` waits for earlier chat/reset work to finish.
4. The chat route sends the system prompt, history, and new message to the model.
5. Read the reply and save both messages only after success.
6. Return the reply as plain text. Express 5 forwards async errors to the shared error handler.

### What is history?

`history` is an array in server memory. Its first item is the `system` message containing the AI's instructions. On a follow-up, the model receives messages shaped like this:

```js
[
  { role: "system", content: "You are a customer-support agent for Tomato..." },
  { role: "user", content: "My food order is late." },
  { role: "assistant", content: "An example support reply..." },
  { role: "user", content: "Can I cancel it?" }
]
```

`system` gives instructions, `user` is the customer, and `assistant` is the model. `history.slice()` makes a copy of the conversation, and `messages.push(...)` adds the new customer message to that copy. After a successful AI reply, two `history.push(...)` calls save the customer's message and the AI's answer. Failed calls leave history unchanged.

To reset the conversation, `history.length = 1` keeps only the first item: the AI's instructions. This is **not model training or a database**: the server resends saved text each time. Restarting or resetting removes the customer messages and AI replies.

### Why a queue?

A queue is a waiting line. Processing one operation at a time keeps simultaneous chats from mixing turn order and prevents resets during an active model call. Failed calls do not change history or block later work.

**All callers still share one conversation.** The queue keeps order; it does not create private customer sessions.

## 4. Checks and common problems

### Check the JavaScript

Run this inside `02-customer-support-chat-server`:

```bash
npm run check
```

This checks syntax in both `src/server.js` and `public/chat.js`. It does not start the server or test AI replies.

### Check the chat page

1. Run `npm start`, then open `http://localhost:8080`.
2. Type `My food order is late.` and click **Send message**. Your message should appear, followed by an AI reply.
3. While waiting, the page shows `Tomato Support is replying…` and disables the text box and buttons.
4. Send `Can I cancel it?` to try a follow-up using the earlier conversation.
5. Click **New chat**. After a successful reset, the messages disappear and the page shows `New chat ready.`
6. Try sending only spaces. The page should ask you to write a message without calling the model.
7. Make the browser window narrow to check that the chat remains usable on a small screen.

If sending fails, the page shows an error and keeps your draft so you can retry. If resetting fails, it keeps the visible conversation.

Valid messages call your provider and may cost money. All browser tabs and API callers share the same server history. Refreshing the page clears only the visible message list; use **New chat** to reset the server conversation.

### Check the API directly (optional)

With the server running, check blank-input rejection without calling the model:

```bash
curl -i -X POST http://localhost:8080/api/chat \
  -H 'Content-Type: text/plain' \
  --data ' '
```

Expected: `400` with `Message text is required.` There is no automated test suite. Valid chat examples call your provider and may cost money; syntax checks do not verify provider compatibility.

- **Missing settings:** fill in `.env` and run from this lesson's folder.
- **Page does not open:** check that `npm start` is still running and that the browser address uses the port from `.env`.
- **Page opened as a local file:** use `http://localhost:8080`, not a `file://` address. No separate frontend server or Live Server extension is needed.
- **Changes do not appear:** refresh the browser after editing frontend files. Restart the server after server changes, or use `npm run dev`.
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

The model cannot access real orders, issue refunds, or look up company policies. Prompts guide behavior but do not guarantee correct answers or prevent all prompt injection. No database or streaming is included. Refreshing the page hides its message list without resetting the server's history. There are no private customer sessions.

[Back to the learning index](../README.md)
