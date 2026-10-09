# Gen AI Learning Lab

A growing collection of hands-on chapters for learning to build AI applications with JavaScript. Each chapter introduces a concept through a small working project.

Start with Chapter 01 and work through the chapters in order. More chapters will be added as the learning journey continues.

## Learning path

- **[01 — Ticket Summarizer](./01-basic-llm-call-server/README.md)**
  Make your first LLM API call. Learn provider configuration, prompts, message roles, and input validation.
- **[02 — Support Chat](./02-customer-support-chat-server/README.md)**
  Build a browser chatbot. Learn conversation history, follow-up context, request ordering, and resetting a chat.

Chapter 01 processes one ticket at a time. Chapter 02 builds on that foundation by including earlier messages in each model call.

## Before you start

You need:

- Basic JavaScript knowledge: variables, arrays, functions, and `async`/`await`.
- **Node.js 20+**, **npm**, and a terminal.
- A provider account with an API key, API base URL, and model ID supporting **OpenAI-compatible Chat Completions**.

An **LLM** (large language model) generates text from instructions and input. Your app sends those messages to a provider's API and receives a generated reply. You are using an existing model, not training one.

Both current chapters use the OpenAI SDK, a JavaScript library for making model requests. The configured base URL determines the provider; the SDK does not require that provider to be OpenAI.

## How to use each chapter

1. **Run it:** follow the chapter's setup and try its example.
2. **Trace it:** read the code walkthrough alongside `src/server.js`.
3. **Experiment:** change one instruction or input and compare results.
4. **Check your understanding:** answer the chapter's recap questions.

Each chapter has its own dependencies and `.env` settings. Run npm commands inside that chapter's folder, not at the repository root. Both current servers default to port `8080`; stop one before starting the other.

Setup commands use macOS/Linux shell syntax. In Windows PowerShell, use `Copy-Item .env.example .env` instead of `cp`, and `curl.exe` instead of `curl` (put the request on one line).

## Use safely

Use fictional data: messages go to your provider and calls may cost money. Keep API keys private in ignored `.env` files. These are learning demos, not production apps: no authentication or rate limiting. Chapter 02 shares one conversation across all callers. Treat model output as unverified.

[Contributing](./CONTRIBUTING.md)
