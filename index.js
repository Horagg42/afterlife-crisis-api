import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const NOTION_API_KEY = "ntn_b586357446662yJo8uHyOrNH8dDPPMUu7QvqzJq0vHc1yV";
const DATABASE_ID = "18b15d7f0bc28009a7aaccce3b631437";

app.get("/notion/lore", async (req, res) => {
  try {
    const response = await fetch(`https://api.notion.com/v1/databases/${DATABASE_ID}/query`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${NOTION_API_KEY}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json"
      }
    });

    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Fehler beim Abruf aus Notion" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API läuft auf Port ${PORT}`));

