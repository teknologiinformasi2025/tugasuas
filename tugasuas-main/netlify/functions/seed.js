const { Client } = require("pg");

exports.handler = async () => {
  const client = new Client({
    connectionString: process.env.NEON_DB_URL,
    ssl: { rejectUnauthorized: false },
  });

  const peserta = [];

  // Tambahkan trial manual
  peserta.push({ id: "trial1234", name: "Trial User" });

  // Tambahkan peserta ID 2417041001 - 2417041051
  for (let i = 2417041001; i <= 2417041051; i++) {
    peserta.push({ id: `${i}`, name: `Peserta ${i}` });
  }

  try {
    await client.connect();

    for (const p of peserta) {
      await client.query(
        `
        INSERT INTO scores (id, name, score, unlocked)
        VALUES ($1, $2, 0, false)
        ON CONFLICT (id) DO NOTHING
      `,
        [p.id, p.name]
      );
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, total: peserta.length }),
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
