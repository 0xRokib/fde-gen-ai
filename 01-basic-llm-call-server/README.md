# Chapter 01 — Ticket Summarizer

**Build:** An API that turns a support ticket into a short summary.
**Learn:** Provider setup, system/user messages, model calls, and input validation.

## Run

Requires Node.js 20+, npm, and an OpenAI-compatible Chat Completions provider. From the repository root:

```bash
cd 01-basic-llm-call-server
npm ci
cp .env.example .env
```

Skip the copy if `.env` already exists. Fill in `NEPTUNE_API_KEY`, `NEPTUNE_BASE_URL`, and `NEPTUNE_MODEL` with your provider settings. Use the API base URL, without `/chat/completions`.

```bash
npm start
```

In another terminal:

```bash
curl -X POST http://localhost:8080/api/summarize \
  -H 'Content-Type: text/plain' \
  --data 'Customers cannot pay because checkout times out.'
```

Possible reply:

```text
Checkout times out during payment.
Customers cannot complete purchases.
```

Send plain text, not JSON. There is no browser page. If you change `PORT`, update the URL.

## Understand the code

All code: [`src/server.js`](./src/server.js).

1. Load `.env`, validate settings, and create the model client.
2. Express receives `POST /api/summarize` and rejects blank input.
3. Send two messages: **system** gives summarization rules; **user** contains the ticket.
4. Read the first model reply and return it as plain text.
5. Return `502` if the model call fails or returns an empty reply.

**No memory:** Every request starts fresh. The prompt asks for two lines, but code does not enforce that format.

## Check and practice

- Check syntax: `node --check src/server.js`. This does not test live AI calls.
- Send only spaces: expect `400` and `Ticket text is required.`
- Change the prompt to request three bullet points; compare replies.
- Try a non-ticket message; see whether the model rejects it.

**Problems:** `400` = missing/plain-text input issue; `413` = body over `100kb`; `502` = model-call failure. Check provider settings, quota, and connectivity. If port is busy, stop the other chapter or change `PORT`.

## Limits

Use fictional tickets and keep API keys private. Calls send text to your provider and may cost money. Prompts and summaries are not guarantees. No authentication or rate limiting; keep this demo in a trusted local environment.

[Next: Chapter 02](../02-customer-support-chat-server/README.md) · [All chapters](../README.md)
