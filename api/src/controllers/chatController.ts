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

  try {
    const decisionText = await decideAction(query);
    res.write(`data: ${JSON.stringify({ type: "reasoning", content: decisionText })}\n\n`);

    let decision: { action?: string; search_query?: string } = {};
    try {
      decision = JSON.parse(decisionText);
    } catch {
      const m = decisionText.match(/web_search:(.+)/i);
      if (m) decision = { action: "web_search", search_query: m[1].trim() };
    }

    let toolOutput = "";
    if (decision.action === "web_search" && decision.search_query) {
      const q = decision.search_query;
      res.write(`data: ${JSON.stringify({ type: "tool_call", tool: "web_search", input: q, output: null })}\n\n`);
      toolOutput = await webSearch(q);
      res.write(`data: ${JSON.stringify({ type: "tool_call", tool: "web_search", input: q, output: toolOutput })}\n\n`);
    }

    await streamFinalAnswer({
      userQuery: query,
      toolOutput, // may be empty
      onChunk: (chunkText: string) => {
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
