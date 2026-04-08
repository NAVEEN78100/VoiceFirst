const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: "postgresql://postgres:root@localhost:5432/voicefirst?schema=public"
  });
  await client.connect();
  const res = await client.query("SELECT id, name, code, location FROM branches");
  console.log('Branches:', JSON.stringify(res.rows, null, 2));
  
  const cols = await client.query("SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'branches'");
  console.log('Columns:', JSON.stringify(cols.rows, null, 2));
  
  await client.end();
}

main().catch(console.error);
