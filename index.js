import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const NOTION_API_KEY = process.env.NOTION_API_KEY || "ntn_b586357446662yJo8uHyOrNH8dDPPMUu7QvqzJq0vHc1yV";
const DATABASE_ID = process.env.DATABASE_ID || "18b15d7f0bc28009a7aaccce3b631437";

async function fetchLoreFromNotion() {
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
        return data.results.map(page => ({
            id: page.id,
            name: page.properties?.Name?.title?.[0]?.plain_text || "Unbenannt",
            description: page.properties?.Beschreibung?.rich_text?.[0]?.plain_text || "Keine Beschreibung",
            url: page.url
        }));
    } catch (error) {
        console.error("Fehler beim Abruf aus Notion:", error);
        return [];
    }
}

// 🔹 Endpunkt: Alle Einträge mit Limit abrufen
app.get("/notion/lore", async (req, res) => {
    const results = await fetchLoreFromNotion();
    const limit = req.query.limit ? parseInt(req.query.limit) : 5;
    res.json(results.slice(0, limit));
});

// 🔹 Endpunkt: Spezifischen Eintrag suchen
app.get("/notion/lore/:name", async (req, res) => {
    const name = req.params.name.toLowerCase();
    const results = await fetchLoreFromNotion();
    
    const foundEntry = results.find(entry => entry.name.toLowerCase() === name);

    if (foundEntry) {
        res.json(foundEntry);
    } else {
        res.status(404).json({ error: "Eintrag nicht gefunden" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API läuft auf http://afterlife-crisis-api.onrender.com/notion/lore`));
