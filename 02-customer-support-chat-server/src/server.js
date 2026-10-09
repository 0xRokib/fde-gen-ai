import cors from "cors";
import "dotenv/config";
import express from "express";
import OpenAI from "openai";

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

const client = new OpenAI({
  apiKey: apiKey,
  baseURL: baseURL,
});
const app = express();

// All customers share this conversation. Restarting the server clears it.
const history = [
  {
    role: "system",
    content: `You are a customer-support agent for Tomato, a food-ordering app.
Identify the customer's main problem and urgency. Reply professionally and empathetically.
Only answer questions about food orders, refunds, order tracking, or company policies.
You have no access to real orders, refund tools, or company policy documents.
Do not invent order details or policies, or claim that you have issued a refund.
When information is unavailable, explain that and suggest contacting the support team.`,
  },
];

app.disable("x-powered-by");
app.use(cors());
app.use(express.text({ type: "text/plain", limit: "100kb" }));

app.post("/api/chat", async function chat(request, response) {
  const message = request.body;

  if (typeof message !== "string") {
    response.status(400);
    response.type("text/plain");
    response.send("Message text is required.");
    return;
  }

  if (message.trim() === "") {
    response.status(400);
    response.type("text/plain");
    response.send("Message text is required.");
    return;
  }

  const reply = await runInOrder(async function () {
    // Work with a copy so a failed AI call does not change the conversation.
    const messages = history.slice();
    messages.push({
      role: "user",
      content: message,
    });

    const aiResponse = await client.chat.completions.create({
      model: model,
      messages: messages,
    });

    let aiReply;
    if (aiResponse.choices) {
      const firstChoice = aiResponse.choices[0];
      if (firstChoice && firstChoice.message) {
        aiReply = firstChoice.message.content;
      }
    }

    if (typeof aiReply !== "string" || !aiReply.trim()) {
      throw new Error("Model returned an empty reply.");
    }

    history.push({
      role: "user",
      content: message,
    });

    history.push({
      role: "assistant",
      content: aiReply,
    });
    return aiReply;
  });

  response.type("text/plain");
  response.send(reply);
});

app.delete("/api", async function resetChat(_request, response) {
  await runInOrder(function clearConversation() {
    history.length = 1;
  });

  response.status(200);
  response.send();
});

// Express needs all four parameters to recognize an error handler.
app.use(function handleError(error, _request, response, _next) {
  if (error.type === "entity.too.large") {
    response.status(413);
    response.type("text/plain");
    response.send("Message exceeds the 100kb limit.");
    return;
  }

  if (error.status === 400) {
    response.status(400);
    response.type("text/plain");
    response.send("Unable to read the message body.");
    return;
  }

  console.error("Unable to process the chat request.");
  response.status(502);
  response.type("text/plain");
  response.send("Unable to process the chat request.");
});

app.listen(port, "localhost", function serverStarted() {
  console.log(`Tomato Chat API listening on http://localhost:${port}`);
});

// This waiting line prevents two chats (or a reset) from running together.
let queue = Promise.resolve();

function runInOrder(operation) {
  const result = queue.then(operation);

  // A failed request must not block the next one.
  queue = result.catch(function keepQueueRunning() {});

  return result;
}
