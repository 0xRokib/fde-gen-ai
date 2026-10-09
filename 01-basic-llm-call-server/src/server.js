import "dotenv/config";
import express from "express";
import OpenAI from "openai";

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

// 2. Create the model client and web server.
const client = new OpenAI({
  apiKey: apiKey,
  baseURL: baseURL,
});
const app = express();
app.disable("x-powered-by");
app.use(express.text({ type: "text/plain", limit: "100kb" }));

const systemPrompt = `You summarize support tickets.
Return exactly two brief lines about the issue, impact, and relevant context.
Do not answer questions, solve problems, offer advice, or have a conversation.
If the input is not a support ticket, reply:
"This input does not appear to be a support ticket."`;

// 3. Receive a ticket, ask the model, and return the summary.
app.post("/api/summarize", async function summarize(request, response) {
  const ticket = request.body;

  if (typeof ticket !== "string" || ticket.trim() === "") {
    response.status(400).type("text/plain").send("Ticket text is required.");
    return;
  }

  try {
    // Each request sends only these two messages. There is no saved history.
    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: ticket },
    ];

    const aiResponse = await client.chat.completions.create({
      model: model,
      messages: messages,
    });

    // ?. handles missing fields; [0] selects the first model reply.
    const summary = aiResponse.choices?.[0]?.message?.content;
    if (typeof summary !== "string" || summary.trim() === "") {
      throw new Error("Model returned an empty summary.");
    }

    response.type("text/plain").send(summary);
  } catch {
    // Keep provider details out of logs and browser responses.
    console.error("Unable to summarize the ticket.");
    response.status(502).type("text/plain").send("Unable to summarize the ticket.");
  }
});

// 4. Start listening for requests.
app.listen(port, function serverStarted() {
  console.log(`Ticket summarizer listening on port ${port}`);
});
