const form = document.getElementById("chat-form");
const input = document.getElementById("message-input");
const messages = document.getElementById("messages");
const welcome = document.getElementById("welcome");
const status = document.getElementById("status");
const sendButton = document.getElementById("send-button");
const resetButton = document.getElementById("reset-button");
const sendLabel = document.getElementById("send-label");
const mode = document.getElementById("mode");
const settings = {
  chat: {
    endpoint: "/api/chat", reset: "/api", name: "Tool Assistant", title: "Chat with tools",
    welcome: "Let the assistant do the lookup.",
    description: "Try “Convert 100 USD to BDT”, “What is 125 × 8?”, or “What is the weather in Dhaka?”",
    note: "Weather needs a WeatherAPI key. AI replies can be wrong; verify important results.",
    placeholder: "Convert 100 USD to BDT using the latest rate.",
    label: "Your message", send: "Send message", resetLabel: "New chat",
    loading: "Assistant is replying; tool lookups may take a moment…",
  },
  website: {
    endpoint: "/api/website", reset: "/api/website", name: "Website Assistant", title: "Website generator",
    welcome: "Describe the website you want to build.",
    description: "Try “Create a responsive coffee shop website in a new folder called coffee-demo. Write and check all files, then list them.”",
    note: "Files are saved in generated-sites/ relative to the server working folder. Inspect generated code before opening it. Existing project files may be overwritten. No automatic preview is provided.",
    placeholder: "Create a coffee shop website with a menu and contact section in coffee-demo.",
    label: "Website instructions", send: "Generate website", resetLabel: "New project chat",
    loading: "Generating and checking website files… This may take several model calls.",
  },
};
const views = {
  chat: { nodes: [], draft: "", status: "Ready when you are.", error: false },
  website: { nodes: [], draft: "", status: "Ready to build a website.", error: false },
};
let activeMode = "chat";

function renderMode() {
  const config = settings[activeMode];
  const view = views[activeMode];
  document.querySelector("h1").textContent = config.title;
  document.getElementById("welcome-title").textContent = config.welcome;
  document.getElementById("welcome-description").textContent = config.description;
  document.getElementById("welcome-note").textContent = config.note;
  document.getElementById("input-label").textContent = config.label;
  input.placeholder = config.placeholder;
  input.value = view.draft;
  sendLabel.textContent = config.send;
  resetButton.textContent = config.resetLabel;
  messages.replaceChildren(...view.nodes);
  welcome.hidden = view.nodes.length > 0;
  status.textContent = view.status;
  status.className = view.error ? "error" : "";
}
mode.addEventListener("change", function () {
  views[activeMode].draft = input.value;
  views[activeMode].status = status.textContent;
  views[activeMode].error = status.className === "error";
  activeMode = mode.value;
  renderMode();
});

function addMessage(speaker, text) {
  const message = document.createElement("article");
  message.className = "message " + speaker;
  const name = document.createElement("strong");
  name.textContent = speaker === "user" ? "You" : settings[activeMode].name;
  const content = document.createElement("p");
  content.textContent = text;
  message.append(name, content);
  views[activeMode].nodes.push(message);
  messages.append(message);
  welcome.hidden = true;
  message.scrollIntoView({ block: "nearest" });
  return message;
}
function responseError(response, body) {
  if (response.status === 404) {
    return "This server does not support the selected feature. Restart Chapter 03 with npm start, then refresh this page.";
  }
  if (response.headers.get("content-type")?.includes("text/html")) {
    return `Server request failed (HTTP ${response.status}). Check the server terminal.`;
  }
  return body || "Unable to process your message.";
}
function setBusy(busy) {
  input.disabled = busy;
  sendButton.disabled = busy;
  resetButton.disabled = busy;
  mode.disabled = busy;
  sendButton.classList.toggle("is-busy", busy);
  sendLabel.textContent = busy ? (activeMode === "website" ? "Generating…" : "Sending…") : settings[activeMode].send;
  form.setAttribute("aria-busy", String(busy));
}
form.addEventListener("submit", async function (event) {
  event.preventDefault();
  const message = input.value.trim();
  if (!message) {
    status.textContent = "Please write a message first.";
    input.focus();
    return;
  }
  setBusy(true);
  status.className = "";
  status.textContent = settings[activeMode].loading;
  const userMessage = addMessage("user", message);
  try {
    const response = await fetch(settings[activeMode].endpoint, {
      method: "POST", headers: { "Content-Type": "text/plain" }, body: message,
    });
    const reply = await response.text();
    if (!response.ok) throw new Error(responseError(response, reply));
    addMessage("assistant", reply);
    input.value = "";
    status.textContent = activeMode === "website"
      ? "Response received. Check the listed files in generated-sites/. You can request changes below."
      : "Reply received. Ask a follow-up question.";
  } catch (error) {
    userMessage.remove();
    views[activeMode].nodes.pop();
    welcome.hidden = messages.children.length > 0;
    status.className = "error";
    status.textContent = "Could not get a reply. " + error.message + " Your draft is still below."
      + (activeMode === "website" ? " Some files may already have been written; inspect them before retrying." : "");
  } finally {
    setBusy(false);
    input.focus();
  }
});
resetButton.addEventListener("click", async function () {
  setBusy(true);
  status.className = "";
  status.textContent = "Clearing conversation history…";
  try {
    const response = await fetch(settings[activeMode].reset, { method: "DELETE" });
    if (!response.ok) throw new Error(responseError(response, await response.text()));
    views[activeMode].nodes = [];
    messages.replaceChildren();
    welcome.hidden = false;
    input.value = "";
    status.textContent = activeMode === "website" ? "New project chat ready. Existing files were not deleted." : "New chat ready.";
  } catch (error) {
    status.className = "error";
    status.textContent = "Could not confirm reset. " + error.message;
  } finally {
    setBusy(false);
    input.focus();
  }
});
