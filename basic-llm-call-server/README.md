# Ticket summarizer (Node.js 20+)

Send support ticket as text. Server asks Neptune chat model for two-line summary and returns plain text.

## Start

```bash
cd basic-llm-call-server
npm ci
cp .env.example .env
```

Open `.env` and set `NEPTUNE_API_KEY`, `NEPTUNE_BASE_URL` (your provider’s OpenAI-compatible API URL), and `NEPTUNE_MODEL` (your provider’s model ID). Adjust `PORT` if needed. Keep `.env` private. Then:

```bash
npm start
```

In another terminal:

```bash
curl -X POST http://localhost:8080/api/summarize \
  -H 'Content-Type: text/plain' \
  --data 'Customers cannot complete checkout because the payment page times out.'
```

Everything happens in `src/server.js`: load key, receive ticket, call chat-completions API, return summary. Change prompt or model there. `.env` holds your private key; never paste it into code.

API key stays server-side. Model availability and live provider response require your own key to verify. Do not expose this billable API publicly without authentication and rate limiting.
