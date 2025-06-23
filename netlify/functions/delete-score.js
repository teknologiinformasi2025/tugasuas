const { Client } = require("pg");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  const { id } = JSON.parse(event.body || "{}");

  if (!id) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing ID" }),
    };
  }

  const client = new Client({
    connectionString: process.env.NEON_DB_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();

    const result = await client.query(
      `UPDATE scores
       SET score = 0,
           duration = NULL,
           last_updated = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [id]
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
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
