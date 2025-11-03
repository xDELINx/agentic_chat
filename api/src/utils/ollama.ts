import axios from "axios";

const OLLAMA_URL = process.env.OLLAMA_API_URL || "http://127.0.0.1:11434/api/generate";


export const decideAction = async (userQuery: string): Promise<string> => {
  const systemPrompt = `
You are an agentic assistant. Given the user's query, first return a JSON object ONLY with shape:
{"action":"none" | "web_search", "search_query": "<if web_search, put the query here>"}
Do not print anything else. Example:
{"action":"web_search","search_query":"state of AI 2025"}

User query: ${userQuery}
`;

  const body = {
    model: "llama3.2:1b",
    prompt: systemPrompt,
    stream: false
  };

  const resp = await axios.post(OLLAMA_URL, body, { headers: { "Content-Type": "application/json" }, responseType: "json" });
  if (resp.data && typeof resp.data === "object" && "response" in resp.data) {
    return String((resp.data as any).response);
  }
  return typeof resp.data === "string" ? resp.data : JSON.stringify(resp.data);
};

export const streamFinalAnswer = async (opts: {
  userQuery: string;
  toolOutput?: string;
  onChunk: (chunk: string) => void;
}) => {
  const { userQuery, toolOutput = "", onChunk } = opts;

  console.log(userQuery);
  console.log(toolOutput);

  let finalPrompt = `You are an assistant. Given the user's query, answer concisely.\nUser query: ${userQuery}\n`;
  if (toolOutput) {
    finalPrompt += `Use the following tool output (web search results) to inform your answer:\n${toolOutput}\n`;
  }
  finalPrompt += `Stream the answer token-by-token or chunk-by-chunk.`;

  const body = {
    model: "llama3.2:1b",
    prompt: finalPrompt,
    stream: true
  };

  const resp = await axios.post(OLLAMA_URL, body, {
    headers: { "Content-Type": "application/json" },
    responseType: "stream"
  });

  const stream = resp.data as NodeJS.ReadableStream;
  stream.on("data", (chunk: Buffer) => {
    const text = chunk.toString("utf-8");
    // Ollama may emit newline-separated JSON snippets (or plain text); we pass raw
    onChunk(text);
  });

  return new Promise<void>((resolve, reject) => {
    stream.on("end", () => resolve());
    stream.on("error", (err) => reject(err));
  });
};
