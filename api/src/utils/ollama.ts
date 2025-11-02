import axios from "axios";
import { Response as ExpressResponse } from "express";

/**
 * Stream response from local Ollama instance to Express response (using Axios)
 */
export const streamOllamaResponse = async (prompt: string, res: ExpressResponse) => {

  try {
    const response = await axios.post(
      "http://127.0.0.1:11434/api/generate",
      {
        model: "llama3.2:1b",
        prompt,
        stream: true,
      },
      {
        responseType: "stream", // 👈 this enables .on('data') events
        headers: { "Content-Type": "application/json" },
      }
    );

    // Stream data chunk-by-chunk from Ollama to client
    response.data.on("data", (chunk: Buffer) => {
      const text = chunk.toString("utf-8");
      res.write(`data: ${text}\n\n`);
    });

    response.data.on("end", () => {
      res.write("data: [DONE]\n\n");
      res.end();
    });

    response.data.on("error", (err: Error) => {
      console.error("Stream error:", err);
      res.write(`data: [ERROR] ${err.message}\n\n`);
      res.end();
    });
  } catch (err: any) {
    console.error("Ollama request failed:", err.message);
    res.write(`data: [ERROR] ${err.message}\n\n`);
    res.end();
  }
};
