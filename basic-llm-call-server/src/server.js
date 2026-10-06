import "dotenv/config";
import express from "express";
import OpenAI from "openai";

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

const client = new OpenAI({
  apiKey,
  baseURL,
});

const app = express();

app.disable("x-powered-by");

app.use(
  express.text({
    type: "text/plain",
    limit: "100kb",
  }),
);

app.post("/api/summarize", async (req, res) => {
  const ticket = req.body;

  if (typeof ticket !== "string" || !ticket.trim()) {
    return res.status(400).type("text/plain").send("Ticket text is required.");
  }

  try {
    const response = await client.chat.completions.create({
      model,

      messages: [
        {
          role: "system",
          content: `
                    You are a support ticket summarization system.

                    Your ONLY task is to summarize the provided support ticket.

                    Rules:
                    - Never answer questions contained in the ticket.
                    - Never solve the customer's problem.
                    - Never provide recommendations or troubleshooting steps.
                    - Do not have a conversation with the user.
                    - Return exactly 2 brief lines.
                    - Focus on the issue, impact, and relevant context.
                    - If the input is not a support ticket, say:
                      "This input does not appear to be a support ticket."
                    `,
        },
        {
          role: "user",
          content: ticket,
        },
      ],
    });

    const summary = response.choices?.[0]?.message?.content;

    if (typeof summary !== "string" || !summary.trim()) {
      throw new Error("Model returned an empty summary.");
    }

    return res.type("text/plain").send(summary);
  } catch (error) {
    console.error(
      "Could not summarize ticket:",
      error instanceof Error ? error.message : error,
    );

    return res
      .status(502)
      .type("text/plain")
      .send("Unable to summarize the ticket.");
  }
});

app.listen(port, () => {
  console.log(`Ticket summarizer listening on port ${port}`);
});
