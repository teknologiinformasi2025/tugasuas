// netlify/functions/submit-score.js

const { Client } = require("pg");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch (err) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid JSON format" }),
    };
  }

  const { id, name, score, duration } = payload;

  if (
    !id ||
    !name ||
    typeof score !== "number" ||
    typeof duration !== "number"
  ) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing or invalid fields" }),
    };
  }

  const client = new Client({
    connectionString: process.env.NEON_DB_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();

    // Masukkan skor ke database, update jika skor baru lebih tinggi dan durasi lebih pendek
    const query = `
      INSERT INTO scores (id, name, score, duration, unlocked)
      VALUES ($1, $2, $3, $4, false)
      ON CONFLICT (id) DO UPDATE SET
        score = GREATEST(scores.score, EXCLUDED.score),
        duration = LEAST(scores.duration, EXCLUDED.duration),
        last_updated = CURRENT_TIMESTAMP
    `;

    await client.query(query, [id, name, score, duration]);

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: "Score submitted" }),
    };
  } catch (err) {
    console.error("Database error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  } finally {
    await client.end();
  }
};
