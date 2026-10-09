const form = document.getElementById("chat-form");
const input = document.getElementById("message-input");
const messages = document.getElementById("messages");
const welcome = document.getElementById("welcome");
const status = document.getElementById("status");
const sendButton = document.getElementById("send-button");
const resetButton = document.getElementById("reset-button");

function addMessage(speaker, text) {
  const message = document.createElement("article");
  message.className = "message " + speaker;
  const name = document.createElement("strong");
  if (speaker === "user") {
    name.textContent = "You";
  } else {
    name.textContent = "Tomato Support";
  }
  const content = document.createElement("p");
  content.textContent = text;
  message.append(name, content);
  messages.append(message);
  welcome.hidden = true;
  message.scrollIntoView({ block: "nearest" });
  return message;
}

function setBusy(busy) {
  input.disabled = busy;
  sendButton.disabled = busy;
  resetButton.disabled = busy;
}

form.addEventListener("submit", async function (event) {
  event.preventDefault();
  const message = input.value.trim();
  if (message === "") {
    status.textContent = "Please write a message first.";
    input.focus();
    return;
  }
  setBusy(true);
  status.className = "";
  status.textContent = "Tomato Support is replying…";
  const userMessage = addMessage("user", message);

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: message,
    });
    const reply = await response.text();
    if (!response.ok) {
      throw new Error(reply || "Unable to send your message.");
    }
    addMessage("assistant", reply);
    input.value = "";
    status.textContent = "Reply received. Ask a follow-up question.";
  } catch (error) {
    userMessage.remove();
    welcome.hidden = messages.children.length > 0;
    status.className = "error";
    status.textContent = "Could not get a reply. " + error.message + " Your draft is still below.";
  } finally {
    setBusy(false);
    input.focus();
  }
});

resetButton.addEventListener("click", async function () {
  setBusy(true);
  status.className = "";
  status.textContent = "Starting a new chat…";
  try {
    const response = await fetch("/api", { method: "DELETE" });
    if (!response.ok) {
      const errorMessage = await response.text();
      throw new Error(errorMessage || "Unable to reset the conversation.");
    }
    messages.replaceChildren();
    welcome.hidden = false;
    input.value = "";
    status.textContent = "New chat ready.";
  } catch (error) {
    status.className = "error";
    status.textContent = "Could not confirm reset. " + error.message;
  } finally {
    setBusy(false);
    input.focus();
  }
});
