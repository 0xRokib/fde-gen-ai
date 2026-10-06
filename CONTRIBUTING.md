# Contributing

Contributions that make these lessons easier to learn from are welcome: clearer explanations, corrected setup steps, bug fixes, and small exercises.

## Report an issue

Include the lesson folder, Node.js version, command you ran, expected result, and actual result. Redact API keys, personal data, and sensitive provider responses. Use fictional sample inputs.

## Submit a change

1. Fork the repository and create a branch for your change.
2. Keep changes focused on one lesson or improvement.
3. Follow the existing JavaScript style and use npm for the current Node.js lesson.
4. Run the relevant checks and describe what you verified in the pull request.
5. Open a pull request explaining the change and why it helps learners.

For the basic LLM server:

```bash
cd 01-basic-llm-call-server
npm ci
node --check src/server.js
```

For server changes, also verify startup and empty-input rejection using the lesson README. Live-provider checks require your own credentials and may cost money; clearly state when you have not tested them. Never commit `.env` or `node_modules`.

## Lesson format

Keep each lesson in a numbered, descriptive, kebab-case folder at the repository root, such as `01-basic-llm-call-server`. Use the next available two-digit chapter number for a new lesson. Include:

- A README with learning goals, prerequisites, setup, a runnable example, a code walkthrough, troubleshooting, and exercises.
- Source code and the package manifest/lockfile needed to reproduce the example.
- A safe `.env.example` when configuration is required, with placeholders rather than credentials.
- Tests when available, with instructions for running them.
- Relevant limitations, costs, and privacy or security considerations.

Add the lesson to the root README index only when its code and guide are ready. Keep provider URLs and model IDs configurable, and do not present model output as guaranteed behavior.

Only submit material you have permission to share. Do not copy restricted course content or third-party assets into this repository.
