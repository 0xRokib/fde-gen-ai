# Chapter 01: Basic LLM Call Server

Build a small Node.js/Express server that sends a support ticket to a **custom OpenAI-compatible API URL** and returns a plain-text summary.

**The original lesson configuration uses a custom provider, not OpenAI's API directly.** It uses the OpenAI JavaScript SDK as a client for a custom provider endpoint configured through `NEPTUNE_BASE_URL`. The API key and model ID come from that provider, not necessarily from OpenAI. "OpenAI-compatible" describes the API format; it does not identify the company hosting the service or the model behind it.

## Learning goals

By the end of this lesson, you should be able to:

- Keep provider credentials in environment variables rather than source code.
- Point the OpenAI SDK at a custom OpenAI-compatible base URL rather than OpenAI's default API endpoint.
- Separate system instructions from user-provided text.
- Call `chat.completions.create` and extract the model's response.
- Validate incoming requests and handle provider failures.

## Prerequisites

- Node.js 20+ and npm.
- Basic JavaScript, HTTP, and terminal knowledge.
- An API key, an OpenAI-compatible chat-completions URL, and an available model ID from your provider.

The environment variables retain the `NEPTUNE_` names used in the original lesson. Use credentials and a model ID supplied by your custom provider. You do not need an OpenAI API key for this setup unless your provider explicitly requires one. The code does not hardcode a provider endpoint or model, and compatibility depends on your provider's API.

## 1. Install and configure

From the repository root:

```bash
cd 01-basic-llm-call-server
npm ci
cp .env.example .env
```

On Windows PowerShell, use `Copy-Item .env.example .env`.

Edit `.env`:

| Variable | Purpose |
| --- | --- |
| `NEPTUNE_API_KEY` | Your private provider API key |
| `NEPTUNE_BASE_URL` | Provider's OpenAI-compatible API base URL, usually ending in `/v1`; consult its documentation |
| `NEPTUNE_MODEL` | Exact model ID available to your account |
| `PORT` | Local HTTP port; defaults to `8080` |

The URL and model in `.env.example` are placeholders, not a working service. Replace them with your provider's settings. Do not append `/chat/completions` to the base URL; the SDK adds the endpoint path.

## Custom provider vs. direct OpenAI

Both options use the same OpenAI JavaScript SDK and chat-completions request format. The endpoint, credentials, and available models differ.

| Setting | Custom OpenAI-compatible provider | Direct OpenAI API |
| --- | --- | --- |
| API base URL | URL supplied by your provider | `https://api.openai.com/v1` |
| API key | Issued by your custom provider | Issued by OpenAI |
| Model ID | Supplied by your provider | An OpenAI model available to your project |
| Billing and data handling | Your provider's policies | OpenAI's policies |

### Option A: Custom provider (original lesson)

Use your provider's settings in `.env`:

```dotenv
NEPTUNE_API_KEY=replace-with-your-custom-provider-key
NEPTUNE_BASE_URL=https://your-provider.example/v1
NEPTUNE_MODEL=your-provider-model-id
PORT=8080
```

The URL above is a placeholder. The server passes these values to the SDK:

```js
const client = new OpenAI({
  apiKey: process.env.NEPTUNE_API_KEY,
  baseURL: process.env.NEPTUNE_BASE_URL,
});
```

### Option B: Direct OpenAI with the existing server

Create an API key in your [OpenAI API project](https://platform.openai.com/api-keys). API access and billing are separate from a ChatGPT subscription. Keep the key private and confirm that your project has access to the model you choose.

To use OpenAI directly **without changing server code**, set these values in `.env`:

```dotenv
NEPTUNE_API_KEY=replace-with-your-openai-api-key
NEPTUNE_BASE_URL=https://api.openai.com/v1
NEPTUNE_MODEL=replace-with-an-available-openai-chat-model-id
PORT=8080
```

The `NEPTUNE_` variable names are only labels in this example. With this URL and an OpenAI-issued key, requests go directly to OpenAI. Replace the model placeholder with an available model that supports Chat Completions; see [OpenAI's model documentation](https://platform.openai.com/docs/models). Restart the server after editing `.env`.

### Conventional direct OpenAI SDK example (for comparison)

In a standalone script, the usual naming is `OPENAI_API_KEY` and `OPENAI_MODEL`:

```dotenv
OPENAI_API_KEY=replace-with-your-openai-api-key
OPENAI_MODEL=replace-with-an-available-openai-chat-model-id
```

```js
import "dotenv/config";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://api.openai.com/v1",
});

const response = await client.chat.completions.create({
  model: process.env.OPENAI_MODEL,
  messages: [
    { role: "system", content: "Summarize the support ticket in two brief lines." },
    { role: "user", content: "The payment page times out during checkout." },
  ],
});

console.log(response.choices?.[0]?.message?.content);
```

This standalone comparison is not the Express server's configuration: the existing server reads `NEPTUNE_` variables, not `OPENAI_` variables. Adding only `OPENAI_API_KEY` to its `.env` will not configure it. Whichever option you use, keep credentials out of source code and expect provider charges for live calls.

## 2. Start the server

```bash
npm start
```

Expected startup message with the default port:

```text
Ticket summarizer listening on port 8080
```

For automatic restarts while editing:

```bash
npm run dev
```

## 3. Send a ticket

In another terminal:

```bash
curl -X POST http://localhost:8080/api/summarize \
  -H 'Content-Type: text/plain' \
  --data 'Customers cannot complete checkout because the payment page times out.'
```

Use `curl.exe` in Windows PowerShell and put the command on one line if your shell does not support the backslash continuation syntax.

Illustrative output, not a guaranteed response:

```text
The payment page times out during checkout.
Affected customers cannot complete purchases.
```

The prompt asks for two brief lines; the server does not enforce that format. Actual wording and instruction-following vary by model.

## 4. Understand the code

Everything lives in [`src/server.js`](./src/server.js).

1. **Load configuration:** `dotenv/config` reads `.env` from the working directory. Startup checks reject missing settings and invalid ports.
2. **Create the client:** `new OpenAI({ apiKey, baseURL })` overrides the SDK's default OpenAI endpoint with the custom URL from `NEPTUNE_BASE_URL`.
3. **Read the request:** `express.text` accepts `text/plain` bodies up to `100kb`.
4. **Validate the ticket:** empty text or unsupported body types return `400` before calling the model.
5. **Build messages:** the system message defines the summarization task; the user message contains the ticket.
6. **Call the model:** `client.chat.completions.create({ model, messages })` requests a completion.
7. **Read the result:** `response.choices?.[0]?.message?.content` extracts the first response. Missing or empty content is treated as a failure.
8. **Respond:** successful summaries return plain text; provider or response failures return a generic `502` message.

The relevant client configuration is:

```js
const client = new OpenAI({
  apiKey: process.env.NEPTUNE_API_KEY,
  baseURL: process.env.NEPTUNE_BASE_URL,
});
```

With the original custom-provider settings, requests go to your provider's chat-completions endpoint. With Option B above, they go directly to `api.openai.com`. The SDK provides the request/response interface; your custom provider supplies the model service.

There is no database, browser UI, streaming, authentication, or conversation history in this lesson.

## 5. Check validation without an LLM call

With the server running:

```bash
curl -i -X POST http://localhost:8080/api/summarize \
  -H 'Content-Type: text/plain' \
  --data ' '
```

Expected: HTTP `400` with `Ticket text is required.` This request is rejected locally and does not call the provider.

Check JavaScript syntax:

```bash
node --check src/server.js
```

This lesson currently has no automated test suite. A syntax check does not verify a live model call.

## Troubleshooting

| Symptom | What to check |
| --- | --- |
| `NEPTUNE_API_KEY is required.` (or another required-setting error) | Create `.env`, fill in all three provider settings, and start from the lesson folder |
| `PORT must be an integer between 1 and 65535.` | Use a valid integer port in `.env` |
| `EADDRINUSE` | Stop the process using the port or choose another `PORT`; update your curl URL too |
| HTTP `400` | Send non-empty text with `Content-Type: text/plain`, not JSON |
| HTTP `413` | Request body exceeds the `100kb` parser limit |
| HTTP `502` | Check the server terminal and provider documentation for key, URL, model, quota, or connectivity problems |

Do not paste credentials or unredacted provider logs into issues.

## Exercises

1. Change the prompt to request three bullet points. Compare outputs across several fictional tickets.
2. Submit a non-ticket message and check whether the model follows the rejection instruction.
3. Add a maximum ticket-length check before the provider call.
4. Add a `GET /health` endpoint that does not call the model.
5. Write tests for empty input and a mocked provider response without using a real API key.

Reflection: which guarantees come from server validation, and which are only requests made to the model?

## Safety and limitations

API keys stay server-side, but ticket text is sent to your provider. Use fictional data and monitor API spending. Do not expose this billable endpoint publicly without authentication and rate limiting. Prompt instructions do not prevent all prompt injection, and returned summaries may be wrong.

Express starts the server without an explicit host restriction; `localhost` in these examples is not a guarantee of localhost-only binding. Keep this exercise in a trusted local environment.

[Back to the learning index](../README.md)
