import { Request, Response } from "express";
import { streamOllamaResponse } from "../utils/ollama";

export const streamChat = async (req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");

  const prompt = req.body.query || "Hello from Ollama!";

  try {
    await streamOllamaResponse(prompt, res);
  } catch (err) {
    console.error("Error:", err);
    res.write(`data: [ERROR] ${err}\n\n`);
    res.end();
  }
};
