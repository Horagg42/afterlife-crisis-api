import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

const NOTION_API_KEY = process.env.NOTION_API_KEY || "DEIN_FALLBACK_KEY";
const DATABASE_ID = process.env.DATABASE_ID || "DEINE_FALLBACK_DATABASE_ID";

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
            body: JSON.stringify(nextCursor ? { start_cursor: nextCursor } : {})
        });

        const data = await response.json();

        if (!response.ok) {
            return { error: `Notion API Fehler: ${data.message || "Unbekannter Fehler"}` };
        }

        if (data.results) {
            allResults = [...allResults, ...data.results];
        }

        nextCursor = data.next_cursor || null; // Sicherstellen, dass nextCursor entweder null oder ein Wert ist
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
    
    if (results.error) {
        return res.status(500).json(results);
    }

    const limit = req.query.limit ? parseInt(req.query.limit) : results.length;
    res.json(results.slice(0, limit));
});

// 🔹 Endpunkt: Spezifischen Eintrag suchen
app.get("/notion/lore/:name", async (req, res) => {
    const name = req.params.name.toLowerCase();
    const results = await fetchAllNotionEntries();

    if (results.error) {
        return res.status(500).json(results);
    }

    const foundEntry = results.find(entry => entry.name.toLowerCase() === name);

    if (foundEntry) {
        res.json(foundEntry);
    } else {
        res.status(404).json({ error: `Eintrag "${name}" nicht gefunden. Versuch es mit einem anderen Namen!` });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API läuft auf http://afterlife-crisis-api.onrender.com/notion/lore`));
