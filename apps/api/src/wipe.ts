import { driver, write } from './db.js';

const batchSize = 500;
const asNumber = (value: unknown) => typeof value === 'object' && value && 'toNumber' in value ? Number((value as {toNumber: () => number}).toNumber()) : Number(value);

async function wipe() {
  let total = 0;
  while (true) {
    const rows = await write<{deleted: unknown}>('MATCH (n) WITH n LIMIT $batchSize DETACH DELETE n RETURN count(n) AS deleted', {batchSize});
    const deleted = asNumber(rows[0]?.deleted ?? 0);
    total += deleted;
    if (deleted === 0) break;
    if (total % 5000 === 0 || deleted < batchSize) console.log(`Deleted ${total.toLocaleString()} nodes...`);
  }
  console.log(`Wipe complete: deleted ${total.toLocaleString()} nodes and their relationships.`);
}

wipe().finally(() => driver?.close());
