// api/expenses-delete.js
// POST /api/expenses-delete  — deletes one expense by id
import { neon } from "@neondatabase/serverless";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { id } = req.body;
  if (!id) return res.status(400).json({ error: "Missing id" });

  try {
    const sql = neon(process.env.DATABASE_URL);
    await sql`DELETE FROM expenses WHERE id = ${id}`;
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("DB error:", err);
    return res.status(500).json({ error: "Database error" });
  }
}
