# Chapter 01: Basic LLM Call Server

Send a support ticket to an AI model and return a short summary. Each request is independent: the server does not remember previous tickets.

**You will learn:** environment configuration, system/user messages, a model API call, and input validation. All code is in [`src/server.js`](./src/server.js).

## 1. Setup

You need Node.js 20+, npm, basic JavaScript, and a provider supporting **OpenAI-compatible Chat Completions**.

From the repository root:

```bash
cd 01-basic-llm-call-server
npm ci
cp .env.example .env
```

Skip the copy if you already have a configured `.env`. Edit it with your provider's settings:

```dotenv
NEPTUNE_API_KEY=replace-with-your-key
NEPTUNE_BASE_URL=https://your-provider.example/v1
NEPTUNE_MODEL=your-model-id
PORT=8080
```

- **API key:** your secret provider credential.
- **Base URL:** the provider's API address. Do not append `/chat/completions`; the SDK adds it.
- **Model:** the exact model ID supplied by your provider.
- **Port:** where your local server receives requests.

These are placeholders. The OpenAI SDK can call a compatible custom provider; using this SDK does not mean requests go to OpenAI.

For direct OpenAI, keep the same variable names but use an OpenAI-issued key, `https://api.openai.com/v1`, and an available Chat Completions model. API billing is separate from a ChatGPT subscription.

## 2. Run and try

```bash
npm start
```

Use `npm run dev` for automatic restarts while editing. In another terminal:

```bash
curl -X POST http://localhost:8080/api/summarize \
  -H 'Content-Type: text/plain' \
  --data 'Customers cannot complete checkout because the payment page times out.'
```

Example reply—not guaranteed:

```text
The payment page times out during checkout.
Affected customers cannot complete purchases.
```

Send plain text, not JSON. The prompt asks for two brief lines, but the code does not enforce that format. Opening `/` in a browser will not show a website.

On Windows PowerShell, use `Copy-Item` instead of `cp`, and `curl.exe` with the request on one line. If you change `PORT`, update the request URL too.

## 3. How the code works

1. `dotenv/config` loads `.env`; startup checks reject missing settings or an invalid port.
2. `new OpenAI({ apiKey, baseURL })` connects the SDK to your provider.
3. Express reads a `text/plain` body, up to `100kb`, and rejects blank input.
4. The **system message** tells the model to summarize; the **user message** contains the ticket.
5. `client.chat.completions.create({ model, messages })` calls the model.
6. `response.choices?.[0]?.message?.content` reads the reply. Empty replies count as failures.
7. The server returns plain text, or a generic `502` if the model call fails.

No history, database, browser interface, or streaming is included. [Chapter 02](../02-customer-support-chat-server/) adds conversation history and customer-support replies.

## 4. Checks and common problems

Check syntax:

```bash
node --check src/server.js
```

With the server running, check blank-input rejection without calling the model:

```bash
curl -i -X POST http://localhost:8080/api/summarize \
  -H 'Content-Type: text/plain' \
  --data ' '
```

Expected: `400` with `Ticket text is required.` There is no automated test suite; syntax checks do not prove a live provider call works.

- **Missing settings:** fill in `.env` and run from this lesson's folder.
- **`EADDRINUSE`:** stop the other server or change `PORT`.
- **`400`:** send non-empty plain text, not JSON.
- **`413`:** the request body exceeds `100kb`.
- **`502`:** check your provider's key, URL, model, quota, and connectivity. Do not share unredacted logs.

## Try it yourself

1. Ask for three bullet points instead of two lines and compare results.
2. Send a non-ticket message. Does the model follow the rejection instruction?
3. Add `GET /health` without making a model call.

## Safety

Keep API keys in ignored `.env` files. Use fictional tickets: their text goes to your provider, and calls may cost money. Model answers can be wrong; prompts are not security guarantees.

This server has no authentication or rate limiting. It does not explicitly restrict its listening host, even though examples use `localhost`. Keep it in a trusted local environment; do not deploy it publicly as-is.

[Back to the learning index](../README.md)
