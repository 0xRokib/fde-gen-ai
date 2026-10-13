import "dotenv/config";
import express from "express";
import { fileURLToPath } from "node:url";
import { chat, generateWebsite, resetChat, resetWebsite } from "./index.js";

for (const name of ["NEPTUNE_API_KEY", "NEPTUNE_BASE_URL", "NEPTUNE_MODEL"]) {
  if (!process.env[name]?.trim()) throw new Error(`${name} is required.`);
}
const port = Number(process.env.PORT || 8080);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT must be an integer between 1 and 65535.");
}
const app = express();
app.disable("x-powered-by");
app.use(express.text({ type: "text/plain", limit: "100kb" }));
app.use(express.static(fileURLToPath(new URL("./public", import.meta.url))));

// Keep shared chat history and resets in order, like Chapter 02.
let queue = Promise.resolve();
function runInOrder(operation) {
  const result = queue.then(operation);
  queue = result.catch(function keepQueueRunning() {});
  return result;
}
for (const [route, operation] of [["/api/chat", chat], ["/api/website", generateWebsite]]) {
app.post(route, async function replyToMessage(request, response) {
  if (typeof request.body !== "string" || !request.body.trim()) {
    response.status(400).type("text/plain").send("Message text is required.");
    return;
  }
  const reply = await runInOrder(() => operation(request.body));
  if (typeof reply !== "string" || !reply.trim()) throw new Error("Model returned an empty reply.");
  response.type("text/plain").send(reply);
});
}
app.delete("/api/website", async function newWebsite(_request, response) {
  await runInOrder(resetWebsite);
  response.status(200).send();
});
app.delete("/api", async function newChat(_request, response) {
  await runInOrder(resetChat);
  response.status(200).send();
});
app.use(function handleError(error, _request, response, _next) {
  if (error.type === "entity.too.large") {
    response.status(413).type("text/plain").send("Message exceeds the 100kb limit.");
    return;
  }
  console.error("Unable to process the chat request.");
  response.status(502).type("text/plain").send("Unable to process the chat request. Check provider settings and tool API availability.");
});
app.listen(port, "localhost", function serverStarted() {
  console.log(`Tool Chat listening on http://localhost:${port}`);
});
