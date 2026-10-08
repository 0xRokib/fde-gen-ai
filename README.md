# FDE.AI Learning Lab

Hands-on lessons for building small AI applications with JavaScript, Express, and model APIs. This is a personal learning repository, not official course material or production-ready software.

**Start here if you know basic JavaScript and want to learn how a server calls an LLM (large language model).**

## Learning path

Follow the chapters in order. Each guide includes setup, requests you can run, a code walkthrough, and exercises.

| Chapter | Build | Learn |
| --- | --- | --- |
| [01 — Basic LLM Call Server](./01-basic-llm-call-server/) | A support-ticket summarizer | Provider configuration, system/user messages, API calls, and input validation |
| [02 — Customer Support Chat Server](./02-customer-support-chat-server/) | A food-ordering support chatbot | Conversation history, follow-up context, ordered requests, and resetting a chat |

**01 handles one ticket at a time. 02 continues a conversation.** Both use the same provider settings and Chat Completions API. Chapter 02 remembers messages in a shared server-side array and resends them on later calls—not through model training or a database.

## Get started

You need **Node.js 20+, npm, Git**, and a provider account with an API key, base URL, and model supporting OpenAI-compatible Chat Completions. Live calls may cost money.

```bash
git clone https://github.com/0xRokib/fde-gen-ai.git
cd fde-gen-ai/01-basic-llm-call-server
npm ci
cp .env.example .env
```

Fill in `.env` with your provider's `NEPTUNE_API_KEY`, `NEPTUNE_BASE_URL`, and `NEPTUNE_MODEL`, then run:

```bash
npm start
```

The OpenAI SDK can call a compatible custom provider; it does not mean requests go to OpenAI. The base URL determines the service used.

Follow the [Chapter 01 guide](./01-basic-llm-call-server/README.md) to send your first ticket. Both lessons use `http://localhost:8080` in their examples; stop one before starting the other on the same port. These are APIs, not websites—opening `/` in a browser will not show a page.

On Windows PowerShell, use `Copy-Item .env.example .env` instead of `cp`.

## How to study

1. **Run:** follow the guide and send a fictional ticket or message.
2. **Trace:** read `src/server.js` from configuration to request handling to model reply.
3. **Experiment:** change one prompt instruction and compare several outputs.
4. **Check:** try blank input and run the lesson's syntax-check command. Syntax checks do not verify live model behavior.
5. **Practice:** complete the exercises and explain what the server guarantees versus what the prompt only asks for.

Each numbered lesson has its own `README.md`, `.env.example`, npm dependencies, and `src/server.js`. Run commands inside that lesson's folder; there is no root-level npm application.

## Use safely

- Keep credentials in ignored `.env` files; never commit or share API keys.
- Use fictional data. Messages go to your configured provider, whose privacy and billing policies apply.
- Monitor spending: longer conversations resend more text and can cost more.
- Keep these demos local. They have no authentication or rate limiting; Chapter 02 shares one conversation across all callers.
- Treat model output as unverified. Prompts do not guarantee correct answers or prevent all prompt injection.

Found a bug or confusing explanation? See [CONTRIBUTING.md](./CONTRIBUTING.md) for how to help.
