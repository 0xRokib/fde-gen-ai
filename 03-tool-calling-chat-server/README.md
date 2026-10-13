# Chapter 03 — Tool Calling and Website Generation

Use a browser assistant to calculate answers, look up weather, and fetch exchange rates. Switch to the website generator to create HTML, CSS, and JavaScript files from a prompt.

Chapter 02 kept a conversation history. This chapter adds function calling: the model requests a tool, your JavaScript runs it, and the model receives the result before replying.

A small Express server connects the tool-calling code to a frontend patterned after Chapter 02.

## 1. Set up and run

You need Node.js 20+, npm, and a provider/model that supports OpenAI-compatible Chat Completions **with function tools**. A model that supports text chat alone may reject these requests.

From the repository root:

```bash
cd 03-tool-calling-chat-server
npm ci
cp .env.example .env
```

Skip the copy if you already have a configured `.env`. Use the same provider settings as Chapters 01 and 02:

```dotenv
NEPTUNE_API_KEY=your-secret-key
NEPTUNE_BASE_URL=https://your-provider.example/v1
NEPTUNE_MODEL=your-model-id
PORT=8080
WEATHER_API_KEY=
```

Use the API base URL without `/chat/completions`. Keys stay on the server.

For current weather, add a key from [WeatherAPI](https://www.weatherapi.com/) as `WEATHER_API_KEY`. Calculator, exchange rates, and website generation need no additional API keys. Exchange rates come from [Frankfurter](https://frankfurter.dev/).

Stop any other chapter using port 8080, then start this one:

```bash
npm start
```

Open **http://localhost:8080**, or your configured port. Serve the page through this address rather than opening `public/index.html` directly. No frontend build is needed.

Use `npm run dev` to restart the server automatically while editing. With `npm start`, restart the server after backend changes and refresh the page after frontend changes.

## 2. Try chat with tools

Select **Chat with tools** in the Feature menu. Try:

- `What is 125 multiplied by 8?`
- `What is the latest USD to BDT exchange rate?`
- `Convert 100 USD to BDT using the latest rate.`
- `What is the current weather in Dhaka?`

Use **BDT** for Bangladeshi taka, not `BD`. The exchange tool builds the URL from the currency pair; USD/BDT uses `https://api.frankfurter.dev/v2/rate/USD/BDT`. Rates are published reference rates, not live trading quotes.

Ask a follow-up after a reply. **New chat** clears the server's chat history for all callers, along with your visible chat messages.

The page shows the final assistant reply, not a live trace of individual tool calls. Tool functions log their names in the server terminal when called. The model chooses which tools to request, so check its answer rather than assuming it followed every prompt instruction.

## 3. Generate a website

Select **Website generator**, enter a prompt, and click **Generate website**:

```text
Create a responsive coffee shop website in a new directory called coffee-demo.
Include a menu and contact section. Write index.html, style.css, and script.js
if needed. Read and check the files, then list what you created.
```

The button changes to **Generating…** while the server works. Generation may need several model calls. When the reply arrives, inspect the files in:

```text
generated-sites/coffee-demo/
```

The workspace path is relative to the folder where you started the server. Running `npm start` inside this chapter places it here.

You can request changes in a follow-up, such as `Add opening hours to the coffee-demo contact section.` Switching modes preserves each mode's visible messages and draft until you refresh the page.

**New project chat** clears website conversation history for all callers. It does not delete generated files. Reusing a project path can overwrite existing files.

The UI displays the model's reply and any file list it includes. It does not provide a separate file browser, download button, or website preview. Inspect generated HTML and JavaScript before opening them; generated code may make external requests or contain unsafe behavior.

## 4. Follow a request through the code

### A. Browser and server

[`public/chat.js`](./public/chat.js) sends nonempty plain text to the endpoint for the selected feature:

| Request | Action |
| --- | --- |
| `POST /api/chat` | Call `chat(message)` |
| `POST /api/website` | Call `generateWebsite(message)` |
| `DELETE /api` | Reset chat history |
| `DELETE /api/website` | Reset website history |

[`server.js`](./server.js) serves the frontend, validates messages, and queues both features and resets so they run one at a time. The request-body limit is `100kb`. Blank messages return `400` before calling the model; oversized messages return `413`.

The frontend disables controls during a request and keeps your draft if it fails. It renders replies with `textContent`, so returned HTML appears as text rather than executing in the page.

### B. Model and tools

[`index.js`](./index.js) creates the OpenAI SDK client with `NEPTUNE_API_KEY`, `NEPTUNE_BASE_URL`, and `NEPTUNE_MODEL`. Its `complete()` function sends the system prompt, conversation, and tool schemas to your provider.

If the model returns `tool_calls`, the code parses each call's JSON arguments and runs the named function. It adds a `tool` message containing the result and matching `tool_call_id`, then calls the model again. This repeats until the model returns a reply without tool calls.

The model requests actions; your server performs them.

Chat tools:

- `calculate`: add, subtract, multiply, divide, remainder (`mod`), and power.
- `currentWeather`: fetch a city's current weather from WeatherAPI.
- `getExchangeRate`: fetch the rate between two currency codes from Frankfurter.

Website tools:

- `createDirectory`: create a project directory.
- `writeFile`: create or overwrite a text file.
- `readFile`: read a text file.
- `listFiles`: list a directory recursively.

`safePath()` rejects resolved paths outside `generated-sites/`. This is a path check, not a filesystem sandbox: symlinks can bypass that boundary. Keep the workspace free of symlinks and sensitive files.

### C. Conversation history

Chat and website generation use separate arrays in server memory, shared by all callers. The code saves user messages and final assistant replies. Tool calls and results are included in the current request's model loop but are not saved for later turns.

The user message is saved before the provider call, so a failed request can leave an unanswered message in history. Restarting the server clears both histories. Refreshing the browser clears visible messages but leaves server history intact. Files remain after either action.

## 5. Check and experiment

Check JavaScript syntax:

```bash
npm run check
```

With the server running, test website input validation without making a paid model call:

```bash
curl -i http://localhost:8080/api/website \
  -H 'Content-Type: text/plain' --data ' '
```

Expect `400` and `Message text is required.` The same check works for `/api/chat`. No automated test suite is included; syntax checks do not test provider compatibility or AI behavior.

Try these exercises:

1. Compare the terminal tool logs for arithmetic and currency conversion.
2. Generate a small site, inspect its files, and request one change.
3. Try a currency conversion and check whether the model calls both `getExchangeRate` and `calculate`.
4. Add a tool-loop limit or save tool transcripts for follow-up context.

**Check your understanding:** Who executes the tools? What links a tool result to its call? Which history does each reset clear? Does a failed generation undo written files?

## Troubleshooting and limits

- **`Cannot POST /api/website`:** an old or wrong server is running. Stop it, run `npm start` from this chapter, and refresh the page.
- **`EADDRINUSE`:** stop the server using your port or change `PORT`.
- **Startup fails:** check your `NEPTUNE_*` settings and working folder.
- **`502`:** check provider configuration, quota, model tool support, and tool-service availability. The server hides upstream error details from the browser.
- **Weather fails:** add `WEATHER_API_KEY` and check your WeatherAPI account.
- **Generation fails midway:** inspect `generated-sites/` before retrying. Written files are not rolled back.

This localhost-only demo has no authentication or rate limiting. Anyone who can access it shares the conversations and can reset them. The tool loop, saved history, and workspace storage have no application-level caps. Long requests can delay other callers and make several paid provider calls.

Use fictional inputs. Conversation text and tool results go to your model provider; weather queries and currency pairs go to their respective services. Keep `.env` private and review generated files before running or sharing them.

[Previous: Chapter 02](../02-customer-support-chat-server/README.md) · [All chapters](../README.md)
