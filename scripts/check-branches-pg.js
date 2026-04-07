const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: "postgresql://postgres:root@localhost:5432/voicefirst?schema=public"
  });
  await client.connect();
  const res = await client.query("SELECT * FROM branches WHERE name='CHENNAI' OR code='CHENNAI-600001'");
  console.log('Branches found:', JSON.stringify(res.rows, null, 2));
  await client.end();
}

main().catch(console.error);
