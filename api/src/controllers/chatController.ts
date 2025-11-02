import { Request, Response } from "express";
import { decideAction, streamFinalAnswer } from "../utils/ollama";
import { webSearch } from "../utils/tools";

/**
 * Main agentic chat handler
 * - receives { query }
 * - asks LLM to decide if a tool call is needed
 * - if tool needed: call tool, stream tool_call event
 * - finally ask LLM for final answer (with tool output) and stream response event(s)
 */
export const handleChat = async (req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");

  const query = (req.body && req.body.query) ? String(req.body.query) : "";

  if (!query) {
    res.write(`data: ${JSON.stringify({ type: "response", content: "Missing query" })}\n\n`);
    res.end();
    return;
  }

  // 1) Ask LLM to "think" and decide whether to call tool
  try {
    // send an instruction to the model to return a small JSON decision (non-stream)
    const decisionText = await decideAction(query);
    // stream the reasoning event (raw text)
    res.write(`data: ${JSON.stringify({ type: "reasoning", content: decisionText })}\n\n`);

    // try to parse a JSON decision out of model output (we instruct the model to output JSON)
    let decision: { action?: string; search_query?: string } = {};
    try {
      // model should return a JSON object, but fallback if not valid
      decision = JSON.parse(decisionText);
    } catch {
      // best-effort simple detection: look for token 'web_search:' in text
      const m = decisionText.match(/web_search:(.+)/i);
      if (m) decision = { action: "web_search", search_query: m[1].trim() };
    }

    // 2) If tool call required -> call tool and stream tool_call event
    let toolOutput = "";
    if (decision.action === "web_search" && decision.search_query) {
      const q = decision.search_query;
      // stream the tool_call start (tool name + input)
      res.write(`data: ${JSON.stringify({ type: "tool_call", tool: "web_search", input: q, output: null })}\n\n`);
      // run (mock or real) webSearch
      toolOutput = await webSearch(q);
      // stream tool_call result (overwrite the previous with output)
      res.write(`data: ${JSON.stringify({ type: "tool_call", tool: "web_search", input: q, output: toolOutput })}\n\n`);
    }

    // 3) Build a final prompt for the LLM including toolOutput (if any) and stream final answer (token-by-token)
    // streamFinalAnswer will pipe Axios stream chunks and we forward them as `response` events
    await streamFinalAnswer({
      userQuery: query,
      toolOutput, // may be empty
      onChunk: (chunkText: string) => {
        // each chunk -> send as a JSON event with type=response
        res.write(`data: ${JSON.stringify({ type: "response", content: chunkText })}\n\n`);
      },
    });

    res.end();
  } catch (err: any) {
    console.error("Agent error:", err);
    res.write(`data: ${JSON.stringify({ type: "response", content: "[ERROR] " + (err.message || err) })}\n\n`);
    res.end();
  }
};
