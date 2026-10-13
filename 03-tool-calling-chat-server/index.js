import "dotenv/config";
import OpenAI from "openai";
import fs from "node:fs/promises";
import path from "node:path";

const openai = new OpenAI({
  apiKey: process.env.NEPTUNE_API_KEY,
  baseURL: process.env.NEPTUNE_BASE_URL,
});
const model = process.env.NEPTUNE_MODEL;
const websiteWorkspace = path.resolve("generated-sites");
const chatHistory = [];
const websiteHistory = [];

const chatSystemPrompt = `You are a helpful AI assistant with access to external tools.

Follow these rules:
1. For arithmetic calculations, ALWAYS use the calculator tool.
2. Always use calculator tool for even trivial calculation
3. For current weather, ALWAYS use the currentWeather tool.
4. For currency conversion or exchange rates, ALWAYS use the getExchangeRate tool. For currency conversion, use the calculate tool to multiply the amount by the returned rate.
5. You may call multiple tools when solving a multi-step request.
6. After receiving tool results, explain the answer naturally.
7. Never invent current weather or exchange-rate information.`;

const websiteSystemPrompt = `You are an expert frontend website developer.

Your job is to create complete static websites using the available tools.

Follow these rules:
1. Create a separate directory for every website.
2. Create index.html.
3. Create style.css.
4. Create script.js when JavaScript is useful.
5. Build modern, beautiful and responsive websites.
6. Use only HTML, CSS and vanilla JavaScript.
7. Do not just return website code in your response. Actually create the files using tools.
8. After creating the website, list the project files.
9. Read important files again if needed and fix obvious problems.
10. Finish only when the complete website has been created.`;

function calculate({ operation, a, b }) {
  console.log("Calculator tool called");

  if (operation === "add") return a + b;
  if (operation === "subtract") return a - b;
  if (operation === "multiply") return a * b;
  if (operation === "divide") {
    if (b === 0) throw new Error("Cannot divide by 0");
    return a / b;
  }
  if (operation === "mod") {
    if (b === 0) throw new Error("Cannot calculate mod by 0");
    return a % b;
  }
  if (operation === "power") return a ** b;
  throw new Error(`Unsupported operation ${operation}`);
}

async function currentWeather({ city }) {
  console.log("Weather tool called");
  const url = new URL("https://api.weatherapi.com/v1/current.json");
  url.searchParams.set("key", process.env.WEATHER_API_KEY);
  url.searchParams.set("q", city);
  const response = await fetch(url);
  if (!response.ok) throw new Error(await response.text());
  return response.text();
}

async function getExchangeRate({ from, to }) {
  console.log("Currency Exchange tool called");
  const response = await fetch(
    `https://api.frankfurter.dev/v2/rate/${encodeURIComponent(from)}/${encodeURIComponent(to)}`,
  );
  if (!response.ok) throw new Error(await response.text());
  return response.text();
}

function safePath(relativePath) {
  const resolved = path.resolve(websiteWorkspace, relativePath);
  if (resolved !== websiteWorkspace && !resolved.startsWith(`${websiteWorkspace}${path.sep}`)) {
    throw new Error("Access outside generated-sites is not allowed");
  }
  return resolved;
}

async function createDirectory({ path: relativePath }) {
  try {
    await fs.mkdir(safePath(relativePath), { recursive: true });
    return `Directory created successfully: ${relativePath}`;
  } catch (error) {
    return `Failed to create directory: ${error.message}`;
  }
}

async function writeFile({ path: relativePath, content }) {
  try {
    const file = safePath(relativePath);
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, content, "utf8");
    return `File written successfully: ${relativePath}`;
  } catch (error) {
    return `Failed to write file: ${error.message}`;
  }
}

async function readFile({ path: relativePath }) {
  try {
    return await fs.readFile(safePath(relativePath), "utf8");
  } catch (error) {
    return `Failed to read file: ${error.message}`;
  }
}

async function listFiles({ path: relativePath }) {
  try {
    const directory = safePath(relativePath);
    try {
      await fs.access(directory);
    } catch {
      return `Directory does not exist: ${relativePath}`;
    }

    const files = [];
    async function walk(current) {
      for (const entry of await fs.readdir(current, { withFileTypes: true })) {
        const item = path.join(current, entry.name);
        files.push(path.relative(websiteWorkspace, item));
        if (entry.isDirectory()) await walk(item);
      }
    }
    await walk(directory);
    return files.join("\n");
  } catch (error) {
    return `Failed to list files: ${error.message}`;
  }
}

const chatTools = [
  {
    type: "function",
    function: {
      name: "calculate",
      description: "Performs arithmetic calculations. Supported operations: add, subtract, multiply, divide, mod, power.",
      parameters: {
        type: "object",
        properties: {
          operation: { type: "string", description: "Operation: add, subtract, multiply, divide, mod, power" },
          a: { type: "number", description: "First number" },
          b: { type: "number", description: "Second number" },
        },
        required: ["operation", "a", "b"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "currentWeather",
      description: "Get the current weather of a city.",
      parameters: {
        type: "object",
        properties: { city: { type: "string", description: "Name of the city" } },
        required: ["city"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getExchangeRate",
      description: "Gets the latest exchange rate between two currencies.",
      parameters: {
        type: "object",
        properties: {
          from: { type: "string", description: "Source currency code, for example USD" },
          to: { type: "string", description: "Target currency code, for example BDT (Bangladeshi taka). Use BDT, not BD, for Bangladesh." },
        },
        required: ["from", "to"],
      },
    },
  },
];

const websiteTools = [
  tool("createDirectory", "Creates a new directory inside the website workspace.", {
    path: { type: "string", description: "Relative directory path, for example brewlab" },
  }),
  tool("writeFile", "Creates or overwrites a text file inside the website workspace. Use this to create HTML, CSS and JavaScript files.", {
    path: { type: "string", description: "Relative file path, for example brewlab/index.html" },
    content: { type: "string", description: "Complete content that should be written into the file" },
  }),
  tool("readFile", "Reads the contents of an existing file from the website workspace.", {
    path: { type: "string", description: "Relative file path" },
  }),
  tool("listFiles", "Lists all files and directories inside a website project.", {
    path: { type: "string", description: "Relative directory path, for example brewlab" },
  }),
];

function tool(name, description, properties) {
  return {
    type: "function",
    function: {
      name,
      description,
      parameters: { type: "object", properties, required: Object.keys(properties) },
    },
  };
}

async function complete(systemPrompt, history, tools, functions, message) {
  history.push({ role: "user", content: message });
  const messages = [{ role: "system", content: systemPrompt }, ...history];

  while (true) {
    const completion = await openai.chat.completions.create({ model, messages, tools });
    const reply = completion.choices[0].message;
    if (!reply.tool_calls?.length) {
      history.push({ role: "assistant", content: reply.content });
      return reply.content;
    }

    messages.push(reply);
    for (const call of reply.tool_calls) {
      const result = await functions[call.function.name](JSON.parse(call.function.arguments));
      messages.push({
        role: "tool",
        tool_call_id: call.id,
        content: typeof result === "string" ? result : JSON.stringify(result),
      });
    }
  }
}

export function resetChat() {
  chatHistory.length = 0;
}

export function resetWebsite() {
  websiteHistory.length = 0;
}

export function chat(message) {
  return complete(chatSystemPrompt, chatHistory, chatTools, {
    calculate,
    currentWeather,
    getExchangeRate,
  }, message);
}

export async function generateWebsite(message) {
  await fs.mkdir(websiteWorkspace, { recursive: true });
  return complete(websiteSystemPrompt, websiteHistory, websiteTools, {
    createDirectory,
    writeFile,
    readFile,
    listFiles,
  }, message);
}
