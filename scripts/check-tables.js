const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: "postgresql://postgres:root@localhost:5432/voicefirst?schema=public"
  });
  await client.connect();
  const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public'");
  console.log('Tables:', JSON.stringify(res.rows, null, 2));
  await client.end();
}

main().catch(console.error);
