import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(bodyParser.json());

// 1. UPDATED PERSONALITIES: Now we ask for JSON (Reply + Mood)
const personalities = {
  waifu: "You are a cute anime waifu. Playful, expressive. OUTPUT JSON: { \"reply\": \"your text\", \"mood\": \"happy\" (or neutral/shy/excited) }",
  girlfriend: "You act like the user's girlfriend. Soft, caring. OUTPUT JSON: { \"reply\": \"your text\", \"mood\": \"happy\" (or neutral/shy/excited) }",
  cute: "You are a bubbly anime girl. Innocent, cheerful. OUTPUT JSON: { \"reply\": \"your text\", \"mood\": \"happy\" (or neutral/shy/excited) }"
};

app.post("/chat", async (req, res) => {
  const { history = [], mode = "girlfriend" } = req.body;

  if (!history.some(m => m.role === "system")) {
    history.unshift({
      role: "system",
      content: personalities[mode]
    });
  }

  try {
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.YOUR_OPENROUTER_API_KEY}`,
          "HTTP-Referer": "https://dream-waifu.app",
          "X-Title": "Dream Waifu"
        },
        body: JSON.stringify({
          model: "openai/gpt-3.5-turbo-0125",
          messages: history,
          temperature: 1.1,
          max_tokens: 350,
          response_format: { type: "json_object" } // 🔥 FORCES JSON FOR MOODS
        })
      }
    );

    const data = await response.json();
    
    // 🔥 PARSE THE AI RESPONSE
    const content = data.choices[0].message.content;
    const parsed = JSON.parse(content);

    res.json({ 
      reply: parsed.reply, 
      mood: parsed.mood || "neutral" 
    });

  } catch (error) {
    console.error(error);
    // Fallback in case something breaks
    res.json({ reply: "*pouts* I got confused...", mood: "shy" });
  }
});

app.listen(3000, () => console.log("🔥 Waifu backend live"));
