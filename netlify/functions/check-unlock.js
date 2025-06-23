const { Client } = require("pg");

exports.handler = async (event) => {
  const id = event.queryStringParameters.id;

  if (!id) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "ID missing" }),
    };
  }

  const client = new Client({
    connectionString: process.env.NEON_DB_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    const result = await client.query(
      "SELECT unlocked FROM scores WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ unlocked: false }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ unlocked: result.rows[0].unlocked }),
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal error" }),
    };
  } finally {
    await client.end();
  }
};
