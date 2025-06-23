const { Client } = require("pg");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  const { id, name, score } = JSON.parse(event.body || "{}");

  if (!id || !name || typeof score !== "number") {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "ID, name, and score are required" }),
    };
  }

  const client = new Client({
    connectionString: process.env.NEON_DB_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();

    // Upsert data: update skor jika lebih tinggi, atau insert kalau belum ada
    await client.query(
      `
      INSERT INTO scores (id, name, score)
      VALUES ($1, $2, $3)
      ON CONFLICT (id) DO UPDATE SET
        score = GREATEST(scores.score, EXCLUDED.score),
        last_updated = CURRENT_TIMESTAMP
    `,
      [id, name, score]
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Score submitted successfully" }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  } finally {
    await client.end();
  }
};
