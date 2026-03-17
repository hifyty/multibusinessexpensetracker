// api/expenses-get.js
// GET /api/expenses-get?business=airbnb&year=2026
import { neon } from "@neondatabase/serverless";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const { business, year } = req.query;
  if (!business || !year) return res.status(400).json({ error: "Missing business or year" });

  try {
    const sql = neon(process.env.DATABASE_URL);

    // Create table if it doesn't exist (safe to run every time)
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

    const rows = await sql`
      SELECT * FROM expenses
      WHERE business = ${business} AND year = ${parseInt(year)}
      ORDER BY date DESC, created_at DESC
    `;

    return res.status(200).json({ expenses: rows });
  } catch (err) {
    console.error("DB error:", err);
    return res.status(500).json({ error: "Database error" });
  }
}
