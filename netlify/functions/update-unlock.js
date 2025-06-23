const { Client } = require("pg");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  let id, unlocked;
  try {
    const body = JSON.parse(event.body || "{}");
    id = body.id;
    unlocked = body.unlocked;
  } catch (err) {
    return { statusCode: 400, body: "Invalid JSON body" };
  }

  if (!id || typeof unlocked !== "boolean") {
    return { statusCode: 400, body: "Invalid or missing fields" };
  }

  const client = new Client({
    connectionString: process.env.NEON_DB_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();

    const res = await client.query(
      "UPDATE scores SET unlocked = $1 WHERE id = $2",
      [unlocked, id]
    );

    if (res.rowCount === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ success: false, message: "ID tidak ditemukan" }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  } catch (err) {
    console.error("DB Error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  } finally {
    await client.end();
  }
};
