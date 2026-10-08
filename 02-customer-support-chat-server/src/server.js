import cors from "cors";
import "dotenv/config";
import express from "express";
import OpenAI from "openai";

// 1. Read settings from the .env file (same as Chapter 01).
const apiKey = process.env.NEPTUNE_API_KEY;
const baseURL = process.env.NEPTUNE_BASE_URL;
const model = process.env.NEPTUNE_MODEL;
const port = Number(process.env.PORT || 8080);

// trim() removes spaces, so a setting containing only spaces is also invalid.
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

// 2. Create the AI client and the Express web server.
const client = new OpenAI({
  apiKey,
  baseURL,
});
const app = express();

// The system message tells the AI how to behave.
const SYSTEM_PROMPT = `You are a customer-support agent for Tomato, a food-ordering app.
Identify the customer's main problem and urgency. Reply professionally and empathetically.
Only answer questions about food orders, refunds, order tracking, or company policies.
You have no access to real orders, refund tools, or company policy documents.
Do not invent order details or policies, or claim that you have issued a refund.
When information is unavailable, explain that and suggest contacting the support team.`;

// 3. Remember the conversation in an array, not a database.
// All customers share this history. Restarting the server clears it.
const history = [];
let queue = Promise.resolve();

// A Promise represents work that will finish later.
// .then(operation) starts this operation after the previous one finishes.
function runInOrder(operation) {
  const result = queue.then(operation);

  // A failed request must not stop the next request from running.
  // The original result still reports the error to Express.
  queue = result.catch(function keepQueueRunning() {});
  return result;
}

// 4. Send the conversation to the AI and save its reply.
async function getChatReply(message) {
  const userMessage = {
    role: "user",
    content: message,
  };

  // "user" means the customer; "assistant" means the AI.
  // ...history copies the earlier messages into this new array.
  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history,
    userMessage,
  ];

  // await pauses this function until the AI responds.
  const response = await client.chat.completions.create({
    model,
    messages,
  });

  // ?. safely reads a field even if part of the response is missing.
  const reply = response.choices?.[0]?.message?.content;
  if (typeof reply !== "string" || !reply.trim()) {
    throw new Error("Model returned an empty reply.");
  }

  // Save both messages only after a successful provider response.
  history.push(userMessage);
  history.push({ role: "assistant", content: reply });
  return reply;
}

// 5. Allow frontend requests and read their plain-text bodies.
app.disable("x-powered-by");
app.use(cors());
app.use(express.text({ type: "text/plain", limit: "100kb" }));

// POST /api/chat: send a customer message and receive an AI reply.
app.post("/api/chat", async (request, response) => {
  const message = request.body;

  if (typeof message !== "string" || !message.trim()) {
    return response.status(400).type("text/plain").send("Message text is required.");
  }

  const reply = await runInOrder(function replyToCustomer() {
    return getChatReply(message);
  });

  response.type("text/plain").send(reply);
});

// DELETE /api: clear the conversation before starting a new one.
app.delete("/api", async (_request, response) => {
  await runInOrder(function clearConversation() {
    // Setting an array's length to zero removes all its items.
    history.length = 0;
  });

  response.status(200).send();
});

// 6. Send safe error messages when a request fails.
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

// 7. Start listening for requests on this computer.
app.listen(port, "localhost", () => {
  console.log(`Tomato Chat API listening on http://localhost:${port}`);
});
