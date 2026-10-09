# Gen AI Learning Lab

Two small JavaScript projects for learning how to build with LLM APIs. Start with Chapter 01, then Chapter 02.

## Chapters

- **[01 — Ticket Summarizer](./01-basic-llm-call-server/README.md):** Send one support ticket; get a short summary. Learn prompts, API calls, and input validation.
- **[02 — Support Chat](./02-customer-support-chat-server/README.md):** Chat with a food-ordering support bot in your browser. Learn conversation history, follow-ups, and resetting a chat.

**Main difference:** Chapter 01 handles each request separately. Chapter 02 resends earlier messages to give the model context.

## Start

You need **Node.js 20+, npm**, and an API key from a provider supporting OpenAI-compatible Chat Completions.

```bash
cd 01-basic-llm-call-server
npm ci
cp .env.example .env
```

Fill in `.env`:

```dotenv
NEPTUNE_API_KEY=your-key
NEPTUNE_BASE_URL=https://your-provider.example/v1
NEPTUNE_MODEL=your-model-id
PORT=8080
```

Then run `npm start` and follow the chapter guide. The base URL chooses your provider; using the OpenAI SDK does not require using OpenAI.

Each chapter is a separate app. Run commands inside its folder. Both default to port `8080`, so run one at a time. Chapter 01 is API-only; Chapter 02 has a chat page.

## Keep in mind

Use fictional data: messages go to your provider and calls may cost money. Keep API keys private in `.env`. These are learning demos, not production apps: no authentication or rate limiting. Chapter 02 shares one conversation across all callers. Model answers can be wrong.

[Contributing](./CONTRIBUTING.md)
