// api/scan-receipt.js
// Vercel Serverless Function — runs on the server, API key never reaches the browser

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { imageBase64, mediaType, categories } = req.body;

  if (!imageBase64 || !mediaType || !categories) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "API key not configured" });
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 400,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: { type: "base64", media_type: mediaType, data: imageBase64 },
              },
              {
                type: "text",
                text: `You are a receipt parser for a Canadian small business expense tracker. Extract info from this receipt and return ONLY valid JSON, no markdown, no explanation, no extra text.

Return exactly this shape:
{
  "description": "merchant name and brief item description in ~6 words",
  "amount": "TOTAL amount charged (including GST/HST) as a number only, no $ sign, CAD",
  "gst": "the GST or HST amount as a number only — look for lines labelled GST, HST, TPS, TVH, or Tax on the receipt. If not found, return 0",
  "date": "date in YYYY-MM-DD format",
  "category": "best matching category from this list: ${categories}",
  "notes": "optional extra context e.g. vendor HST number, purpose of purchase"
}

Important GST rules:
- Canada GST is 5%. HST varies by province (13% Ontario, 15% Atlantic).
- Look carefully for any tax line on the receipt before returning 0.
- If the receipt shows HST instead of GST, still return it in the gst field.
- Return the TOTAL amount including tax in the amount field.
- Never add markdown or explanation outside the JSON object.`,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Anthropic API error:", err);
      return res.status(502).json({ error: "Receipt scan failed" });
    }

    const data = await response.json();
    const text = data.content?.find((b) => b.type === "text")?.text || "";
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

    return res.status(200).json(parsed);
  } catch (err) {
    console.error("Scan error:", err);
    return res.status(500).json({ error: "Failed to parse receipt" });
  }
}
