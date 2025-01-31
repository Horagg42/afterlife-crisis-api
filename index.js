import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const NOTION_API_KEY = process.env.NOTION_API_KEY || "ntn_b586357446662yJo8uHyOrNH8dDPPMUu7QvqzJq0vHc1yV";
const DATABASE_ID = process.env.DATABASE_ID || "18b15d7f0bc28009a7aaccce3b631437";

// 🔹 Funktion: Alle Notion-Einträge abrufen (inkl. Pagination)
async function fetchAllNotionEntries() {
    let allResults = [];
    let nextCursor = null;

    do {
        const response = await fetch(`https://api.notion.com/v1/databases/${DATABASE_ID}/query`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${NOTION_API_KEY}`,
                "Notion-Version": "2022-06-28",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                start_cursor: nextCursor // Falls mehr Seiten vorhanden sind
            })
        });

        const data = await response.json();

        if (data.results) {
            allResults = [...allResults, ...data.results];
        }

        nextCursor = data.next_cursor; // Falls es mehr Seiten gibt
    } while (nextCursor);

    return allResults.map(page => ({
        id: page.id,
        name: page.properties?.Name?.title?.[0]?.plain_text || "Unbenannt",
        description: page.properties?.Beschreibung?.rich_text?.[0]?.plain_text || "Keine Beschreibung",
        url: page.url
    }));
}

// 🔹 Endpunkt: Alle Einträge mit Limit abrufen
app.get("/notion/lore", async (req, res) => {
    const results = await fetchAllNotionEntries();
    const limit = req.query.limit ? parseInt(req.query.limit) : results.length; // Alle, falls kein Limit
    res.json(results.slice(0, limit));
});

// 🔹 Endpunkt: Spezifischen Eintrag suchen
app.get("/notion/lore/:name", async (req, res) => {
    const name = req.params.name.toLowerCase();
    const results = await fetchAllNotionEntries();

    const foundEntry = results.find(entry => entry.name.toLowerCase() === name);

    if (foundEntry) {
        res.json(foundEntry);
    } else {
        res.status(404).json({ error: `Eintrag "${name}" nicht gefunden. Versuch es mit einem anderen Namen!` });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API läuft auf http://afterlife-crisis-api.onrender.com/notion/lore`));
