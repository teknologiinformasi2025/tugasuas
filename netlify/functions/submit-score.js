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
    payload = JSON.parse(event.body);
  } catch (err) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Malformed JSON" }),
    };
  }

  const { id, name, score, duration } = payload;

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

    // Upsert: simpan skor dan durasi, unlock tetap FALSE default
    await client.query(
      `
      INSERT INTO scores (id, name, score, duration)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (id) DO UPDATE SET
        score = GREATEST(scores.score, EXCLUDED.score),
        duration = LEAST(scores.duration, EXCLUDED.duration),
        last_updated = CURRENT_TIMESTAMP
    `,
      [id, name, score, duration || null]
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
