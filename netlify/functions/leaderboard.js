const { Client } = require("pg");

exports.handler = async () => {
  const client = new Client({
    connectionString: process.env.NEON_DB_URL, // dari Environment Netlify
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();

    const result = await client.query(`
      SELECT id, name, score, EXTRACT(EPOCH FROM (last_updated - created_at)) * 1000 AS duration
      FROM scores
      ORDER BY score DESC
    `);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result.rows),
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
