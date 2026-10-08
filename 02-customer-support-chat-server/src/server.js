import cors from "cors";
import "dotenv/config";
import express from "express";
import OpenAI from "openai";

// Provider settings (same as Chapter 01).
const apiKey = process.env.NEPTUNE_API_KEY;
const baseURL = process.env.NEPTUNE_BASE_URL;
const model = process.env.NEPTUNE_MODEL;
const port = Number(process.env.PORT || 8080);

if (!apiKey?.trim()) {
  throw new Error("NEPTUNE_API_KEY is required.");
}

if (!baseURL?.trim()) {
  throw new Error("NEPTUNE_BASE_URL is required.");
}

if (!model?.trim()) {
  throw new Error("NEPTUNE_MODEL is required.");
}

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT must be an integer between 1 and 65535.");
}

// Create the AI client and server.
const client = new OpenAI({
  apiKey,
  baseURL,
});
const app = express();

const SYSTEM_PROMPT = `You are a customer-support agent for Tomato, a food-ordering app.
Identify the customer's main problem and urgency. Reply professionally and empathetically.
Only answer questions about food orders, refunds, order tracking, or company policies.
You have no access to real orders, refund tools, or company policy documents.
Do not invent order details or policies, or claim that you have issued a refund.
When information is unavailable, explain that and suggest contacting the support team.`;

// Shared conversation. Restarting the server clears it.
const history = [];
let queue = Promise.resolve();

// Wait for the previous chat or reset before starting the next one.
function runInOrder(operation) {
  const result = queue.then(operation);
  queue = result.catch(() => {}); // Keep the queue working after an error.
  return result;
}

// Ask the model, then remember the message and reply.
async function getChatReply(message) {
  const userMessage = { role: "user", content: message };
  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      ...history,
      userMessage,
    ],
  });

  const reply = response.choices?.[0]?.message?.content;
  if (typeof reply !== "string" || !reply.trim()) {
    throw new Error("Model returned an empty reply.");
  }

  // Save both messages only after a successful provider response.
  history.push(userMessage);
  history.push({ role: "assistant", content: reply });
  return reply;
}

// Read plain text sent by the frontend.
app.disable("x-powered-by");
app.use(cors());
app.use(express.text({ type: "text/plain", limit: "100kb" }));

// Send a message and get a reply.
app.post("/api/chat", async (req, res) => {
  const message = req.body;

  if (typeof message !== "string" || !message.trim()) {
    return res.status(400).type("text/plain").send("Message text is required.");
  }

  const reply = await runInOrder(() => getChatReply(message));
  res.type("text/plain").send(reply);
});

// Start a new conversation.
app.delete("/api", async (_req, res) => {
  await runInOrder(() => {
    history.length = 0;
  });
  res.status(200).send();
});

// Express 5 sends async handler errors here automatically.
// Never expose raw provider errors or credentials.
app.use((error, _req, res, _next) => {
  if (error.type === "entity.too.large") {
    return res
      .status(413)
      .type("text/plain")
      .send("Message exceeds the 100kb limit.");
  }

  if (error.status === 400) {
    return res
      .status(400)
      .type("text/plain")
      .send("Unable to read the message body.");
  }

  console.error("Unable to process the chat request.");
  return res
    .status(502)
    .type("text/plain")
    .send("Unable to process the chat request.");
});

// Start the server locally.
app.listen(port, "localhost", () => {
  console.log(`Tomato Chat API listening on http://localhost:${port}`);
});
