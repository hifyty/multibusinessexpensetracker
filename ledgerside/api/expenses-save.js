// api/expenses-save.js
// POST /api/expenses-save  — creates or updates one expense
import { neon } from "@neondatabase/serverless";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { id, business, year, month, date, description, amount, gst, category, notes } = req.body;

  if (!id || !business || !description || !category) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const sql = neon(process.env.DATABASE_URL);

    await sql`
      CREATE TABLE IF NOT EXISTS expenses (
        id          TEXT PRIMARY KEY,
        business    TEXT NOT NULL,
        year        INTEGER NOT NULL,
        month       INTEGER NOT NULL,
        date        TEXT NOT NULL,
        description TEXT NOT NULL,
        amount      NUMERIC(10,2) NOT NULL DEFAULT 0,
        gst         NUMERIC(10,2) NOT NULL DEFAULT 0,
        category    TEXT NOT NULL,
        notes       TEXT DEFAULT '',
        created_at  TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    // Upsert — insert or update if id already exists
    await sql`
      INSERT INTO expenses (id, business, year, month, date, description, amount, gst, category, notes)
      VALUES (
        ${id}, ${business}, ${parseInt(year)}, ${parseInt(month)},
        ${date}, ${description}, ${parseFloat(amount) || 0}, ${parseFloat(gst) || 0},
        ${category}, ${notes || ''}
      )
      ON CONFLICT (id) DO UPDATE SET
        description = EXCLUDED.description,
        amount      = EXCLUDED.amount,
        gst         = EXCLUDED.gst,
        category    = EXCLUDED.category,
        date        = EXCLUDED.date,
        notes       = EXCLUDED.notes
    `;

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("DB error:", err);
    return res.status(500).json({ error: "Database error" });
  }
}
