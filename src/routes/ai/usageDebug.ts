import { Router } from "express"
import OpenAI from "openai"

const router = Router()
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

router.post("/", async (req, res) => {
  const { input } = req.body

  try {
    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input
    })

    res.json({ output: response.output_text })
  } catch (err) {
    console.error("🧮 USAGE DEBUG ERROR:", err)
    res.status(500).json({ error: "Usage debug failed" })
  }
})

export default router
