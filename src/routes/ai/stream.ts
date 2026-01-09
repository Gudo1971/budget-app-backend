import { Router } from "express";
import { streamAIResponse } from "../../services/ai/streamService";

const router = Router();

router.post("/", async (req, res, next) => {
  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "prompt must be a string" });
    }

    // Streaming headers
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Transfer-Encoding", "chunked");

    await streamAIResponse(prompt, (chunk) => {
      res.write(chunk);
    });

    res.end();
  } catch (err) {
    next(err);
  }
});

export default router;
