# Chapter 01 — Your First LLM Call

Build a **support-ticket summarizer**: send a customer's problem to your server and receive a short AI-generated summary.

By the end, you should understand how to configure a model provider, separate instructions from input, make an API call, and handle invalid input or failed calls.

## 1. Set up and run

You need Node.js 20+, npm, and a provider supporting OpenAI-compatible Chat Completions. From the repository root:

```bash
cd 01-basic-llm-call-server
npm ci
cp .env.example .env
```

`npm ci` installs the project's dependencies. `.env` stores local configuration; skip the copy if you already have a configured file.

Edit `.env` with your provider's values:

```dotenv
NEPTUNE_API_KEY=your-secret-key
NEPTUNE_BASE_URL=https://your-provider.example/v1
NEPTUNE_MODEL=your-model-id
PORT=8080
```

- **API key:** authenticates your requests. Keep it private.
- **Base URL:** your provider's API address. Do not append `/chat/completions`; the SDK adds it.
- **Model:** the exact model ID supplied by your provider.
- **Port:** where your local server listens.

These are placeholders, not working credentials. The OpenAI SDK can call compatible providers; `NEPTUNE_` is just the variable naming used in this project.

Start the server:

```bash
npm start
```

Keep this terminal running. Use `npm run dev` instead if you want automatic restarts after editing server code. Stop with `Ctrl+C`.

## 2. Send your first ticket

In a second terminal:

```bash
curl -X POST http://localhost:8080/api/summarize \
  -H 'Content-Type: text/plain' \
  --data 'Customers cannot pay because checkout times out.'
```

Here, `POST` sends input to `/api/summarize`, the header tells the server it is plain text, and `--data` supplies the ticket.

Possible reply:

```text
Checkout times out during payment.
Customers cannot complete purchases.
```

Wording varies by model. Send plain text, not JSON. This chapter is API-only: opening `/` in a browser does not show a page. If you change `PORT`, update the request URL.

## 3. Follow the code

Open [`src/server.js`](./src/server.js). The flow is: receive ticket, validate it, call the model, return summary.

### A. Configuration and server

`dotenv/config` loads `.env` into `process.env`. Startup checks reject missing provider settings and invalid ports.

```js
const client = new OpenAI({ apiKey, baseURL });
```

This creates the provider client. Express handles incoming HTTP requests. `express.text()` reads `text/plain` bodies, up to `100kb`.

### B. Input validation

The `/api/summarize` handler checks that the ticket is a nonempty string. Invalid input returns `400` before making a model call. This avoids spending money on blank requests.

### C. Instructions and input

The model call uses this structure (prompt shortened here):

```js
const response = await client.chat.completions.create({
  model,
  messages: [
    { role: "system", content: "Summarize the ticket in two brief lines." },
    { role: "user", content: ticket },
  ],
});
```

- **`system`:** instructions describing what the model should do.
- **`user`:** the ticket being processed.
- **`await`:** waits for the provider's reply.

The full prompt asks for issue, impact, and context—not advice or a conversation. It also asks the model to reject non-ticket input.

**Prompt vs. guarantee:** Asking for exactly two lines does not enforce two lines. Code validates the input and checks for a nonempty reply; it does not verify summary accuracy or format.

### D. Read the reply

```js
const summary = response.choices?.[0]?.message?.content;
```

`choices[0]` selects the first reply; `message.content` contains its text. Optional chaining (`?.`) safely handles missing fields.

The server returns the summary as plain text. If the model call fails or the reply is empty, it returns `502` with a generic error message.

**No conversation memory:** Every call sends only the system prompt and current ticket. Earlier tickets are not saved or resent.

## 4. Check and experiment

Check JavaScript syntax:

```bash
node --check src/server.js
```

With the server running, test blank input without calling the model:

```bash
curl -i -X POST http://localhost:8080/api/summarize \
  -H 'Content-Type: text/plain' \
  --data ' '
```

Expect `400` and `Ticket text is required.` There is no automated test suite; syntax checks do not verify provider compatibility.

Try these small exercises:

1. Request three bullet points instead of two lines. Compare several replies.
2. Send a non-ticket question. Does the model follow the rejection instruction?
3. Add `GET /health` that returns `OK` without calling the model.

**Check your understanding:** Why are there two message roles? What does the server enforce, and what does the prompt only request? Will a second ticket include the first one?

## Troubleshooting and limits

- **Startup error:** check `.env` and run from this chapter's folder.
- **`EADDRINUSE`:** another server uses the port; stop it or change `PORT`.
- **`400`:** send nonempty plain text, not JSON.
- **`413`:** request body exceeds `100kb`.
- **`502`:** check provider key, base URL, model, quota, and connectivity.

Use fictional tickets: text goes to your provider and calls may cost money. Keep keys private. Model output can be wrong, and prompts are not security guarantees. No authentication or rate limiting; this server does not explicitly bind to localhost, so keep it in a trusted local environment rather than deploying it publicly.

[Next: Chapter 02 — Support Chat](../02-customer-support-chat-server/README.md) · [All chapters](../README.md)
