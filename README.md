# FDE.AI Course Lessons

Code and exercises from my FDE.AI course. Each lesson lives in its own folder with its own dependencies and setup instructions.

## Lessons

- [Basic LLM Call Server](./basic-llm-call-server/) — Node.js/Express server that calls an OpenAI-compatible LLM API to summarize support tickets.

## Getting started

Open a lesson folder and follow its README. For the first lesson:

```bash
cd basic-llm-call-server
npm ci
cp .env.example .env
# Fill in your provider settings in .env.
npm start
```

Add future lessons as separate folders at the repository root. Never commit API keys or `.env` files.
