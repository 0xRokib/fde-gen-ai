# FDE.AI Learning Lab

A growing collection of hands-on generative AI lessons from my FDE.AI learning journey, shared so others can learn, run the examples, and experiment.

This is a personal learning repository, not official course material. Examples are educational starting points, not production-ready services.

## Who this is for

Developers comfortable with basic JavaScript who want to understand how to build applications with LLM APIs. Start with the first lesson; new lessons will be added in separate folders as the course progresses.

## Chapter index

Follow chapters in numeric order. Folder prefixes (`01-`, `02-`, and so on) keep the learning path easy to navigate.

| Chapter | What you will learn | Code and guide |
| --- | --- | --- |
| 01 — Basic LLM Call Server | Call a custom OpenAI-compatible API from Express, compare it with direct OpenAI setup, and handle responses and errors | [01-basic-llm-call-server](./01-basic-llm-call-server/) |

Only completed lessons are listed here.

## Quick start

You need Node.js 20+, npm, Git, and an API key for a provider that supports OpenAI-compatible chat completions. Provider calls may incur charges.

```bash
git clone https://github.com/0xRokib/fde-gen-ai.git
cd fde-gen-ai/01-basic-llm-call-server
npm ci
cp .env.example .env
```

On Windows PowerShell, use `Copy-Item .env.example .env` instead of `cp`.

Fill in the provider URL, model ID, and API key in `.env`, then run:

```bash
npm start
```

Follow the [lesson guide](./01-basic-llm-call-server/README.md) to send your first request, understand the code, and try the exercises.

## Repository structure

```text
fde-gen-ai/
├── README.md                   # Learning index and getting started
├── CONTRIBUTING.md             # How to report issues and add lessons
└── 01-basic-llm-call-server/    # Chapter 01
    ├── README.md               # Walkthrough, requests, and exercises
    ├── .env.example            # Safe configuration template
    ├── package.json
    ├── package-lock.json
    └── src/server.js
```

Each lesson owns its dependencies and configuration. Run its commands from that lesson's folder; there is no root-level npm application.

## How to learn with this repo

1. Read a lesson's goals and run the example unchanged.
2. Trace the request through the code.
3. Change one thing at a time and compare the results.
4. Try the exercises and note what worked or failed.

## Safety and privacy

- Never commit API keys or `.env` files. Local environment files and `node_modules` are ignored by Git.
- Use fictional tickets. Requests send text to your chosen model provider; do not send personal or confidential data without authorization.
- Set provider spending limits where available. Repeated requests can cost money.
- Do not deploy the lesson server publicly as-is. It has no authentication or rate limiting.
- Model output can be inaccurate. Prompts are instructions, not guarantees or security boundaries.

## Contributing

Found a confusing step or a bug? Open an [issue](https://github.com/0xRokib/fde-gen-ai/issues) or send a pull request. See [CONTRIBUTING.md](./CONTRIBUTING.md) for the lesson format and verification expectations.
