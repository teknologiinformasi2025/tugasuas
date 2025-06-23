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
    console.error("JSON Parse Error:", err);
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
    console.error("Missing or invalid fields", { id, name, score, duration });
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

    const query = `
      INSERT INTO scores (id, name, score, duration)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (id) DO UPDATE SET
        score = GREATEST(scores.score, EXCLUDED.score),
        duration = LEAST(scores.duration, EXCLUDED.duration),
        last_updated = CURRENT_TIMESTAMP
    `;

    console.log("Executing query with values:", [id, name, score, duration]);

    await client.query(query, [id, name, score, duration]);

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: "Score submitted" }),
    };
  } catch (err) {
    console.error("Database Error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error: " + err.message }),
    };
  } finally {
    await client.end();
  }
};
