const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // jika pakai Neon atau Heroku
});

exports.handler = async (event) => {
  const { id } = event.queryStringParameters;

  if (!id) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing ID" }),
    };
  }

  try {
    const client = await pool.connect();
    const result = await client.query(
      "SELECT unlocked FROM peserta WHERE id = $1",
      [id]
    );
    client.release();

    if (result.rows.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ unlocked: false }), // default: terkunci
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ unlocked: result.rows[0].unlocked }),
    };
  } catch (err) {
    console.error("Database error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error" }),
    };
  }
};
