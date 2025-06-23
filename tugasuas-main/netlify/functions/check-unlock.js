const { Client } = require("pg");

exports.handler = async (event) => {
  const id = event.queryStringParameters?.id;
  if (!id) return { statusCode: 400, body: "Missing ID" };

  const client = new Client({
    connectionString: process.env.NEON_DB_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    const res = await client.query(
      "SELECT unlocked FROM scores WHERE id = $1",
      [id]
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ unlocked: res.rows[0]?.unlocked || false }),
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
