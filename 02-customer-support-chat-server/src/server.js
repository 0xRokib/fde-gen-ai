import "dotenv/config";
import cors from "cors";
import express from "express";
import OpenAI from "openai";
import { fileURLToPath } from "node:url";

// 1. Read provider settings from .env.
const apiKey = process.env.NEPTUNE_API_KEY;
const baseURL = process.env.NEPTUNE_BASE_URL;
const model = process.env.NEPTUNE_MODEL;
const port = Number(process.env.PORT || 8080);

if (!apiKey || !apiKey.trim()) {
  throw new Error("NEPTUNE_API_KEY is required.");
}
if (!baseURL || !baseURL.trim()) {
  throw new Error("NEPTUNE_BASE_URL is required.");
}
if (!model || !model.trim()) {
  throw new Error("NEPTUNE_MODEL is required.");
}
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT must be an integer between 1 and 65535.");
}

// 2. Create the model client and serve the browser page.
const client = new OpenAI({
  apiKey: apiKey,
  baseURL: baseURL,
});
const app = express();
// Find public/ relative to this file, even when the working folder changes.
const publicFolder = fileURLToPath(new URL("../public", import.meta.url));

app.disable("x-powered-by");
app.use(cors());
app.use(express.text({ type: "text/plain", limit: "100kb" }));
app.use(express.static(publicFolder));

// 3. Start with the bot's instructions. All callers share this history.
const systemPrompt = `You are a customer-support agent for Tomato, a food-ordering app.
Identify the customer's main problem and urgency. Reply professionally and empathetically.
Only answer questions about food orders, refunds, order tracking, or company policies.
You have no access to real orders, refund tools, or company policy documents.
Do not invent order details or policies, or claim that you have issued a refund.
When information is unavailable, explain that and suggest contacting the support team.`;

const history = [{ role: "system", content: systemPrompt }];

async function getReply(message) {
  // Use a copy: a failed model call must not change saved history.
  const messages = history.slice();
  messages.push({ role: "user", content: message });

  const aiResponse = await client.chat.completions.create({
    model: model,
    messages: messages,
  });

  // ?. handles missing fields; [0] selects the first model reply.
  const reply = aiResponse.choices?.[0]?.message?.content;
  if (typeof reply !== "string" || reply.trim() === "") {
    throw new Error("Model returned an empty reply.");
  }

  // Save both sides only after receiving a valid reply.
  history.push({ role: "user", content: message });
  history.push({ role: "assistant", content: reply });
  return reply;
}

// 4. Process chats and resets one at a time, so history stays in order.
let queue = Promise.resolve();

function runInOrder(operation) {
  const result = queue.then(operation);
  // Recover the waiting line after failure; the caller still receives the error.
  queue = result.catch(function keepQueueRunning() {});
  return result;
}

app.post("/api/chat", async function chat(request, response) {
  const message = request.body;

  if (typeof message !== "string" || message.trim() === "") {
    response.status(400).type("text/plain").send("Message text is required.");
    return;
  }

  const reply = await runInOrder(function replyToMessage() {
    return getReply(message);
  });
  response.type("text/plain").send(reply);
});

app.delete("/api", async function resetChat(_request, response) {
  await runInOrder(function clearConversation() {
    history.length = 1; // Keep the system prompt; remove all chat turns.
  });
  response.status(200).send();
});

// 5. Handle errors. Express 5 sends failed async routes here automatically.
// All four parameters are required for Express to recognize an error handler.
app.use(function handleError(error, _request, response, _next) {
  if (error.type === "entity.too.large") {
    response.status(413).type("text/plain").send("Message exceeds the 100kb limit.");
    return;
  }
  if (error.status === 400) {
    response.status(400).type("text/plain").send("Unable to read the message body.");
    return;
  }

  console.error("Unable to process the chat request.");
  response.status(502).type("text/plain").send("Unable to process the chat request.");
});

app.listen(port, "localhost", function serverStarted() {
  console.log(`Tomato Chat API listening on http://localhost:${port}`);
});
