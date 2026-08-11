import {driver, write} from './db.js';

const rawLotCount = Number(process.env.SEED_RAW_LOTS ?? 100_000);
const batchSize = Number(process.env.SEED_BATCH_SIZE ?? 500);
const stage = process.env.SEED_STAGE ?? 'all';
const farmCount = 500;
const lotsPerBatch = 10;
const maxLots = 300_000;

if (!Number.isInteger(rawLotCount) || rawLotCount < 1 || rawLotCount > maxLots) {
  throw new Error(`SEED_RAW_LOTS must be an integer between 1 and ${maxLots}.`);
}
if (!Number.isInteger(batchSize) || batchSize < 50 || batchSize > 2_000) {
  throw new Error('SEED_BATCH_SIZE must be an integer between 50 and 2000.');
}
if (!['all', 'raw', 'finished'].includes(stage)) throw new Error('SEED_STAGE must be all, raw, or finished.');

const id = (prefix: string, number: number) => `${prefix}-2026-${String(number).padStart(6, '0')}`;
const chunks = <T>(items: T[]) => Array.from({length: Math.ceil(items.length / batchSize)}, (_, index) => items.slice(index * batchSize, (index + 1) * batchSize));
const writeBatches = async (label: string, cypher: string, rows: unknown[]) => {
  for (const [index, batch] of chunks(rows).entries()) {
    await write(cypher, {rows: batch});
    if ((index + 1) % 10 === 0 || index === chunks(rows).length - 1) console.log(`${label}: ${Math.min((index + 1) * batchSize, rows.length).toLocaleString()} / ${rows.length.toLocaleString()}`);
  }
};

const farms = Array.from({length: farmCount}, (_, index) => ({id: id('FARM-L', index + 1), name: `Milk Cooperative ${String(index + 1).padStart(3, '0')}`, region: ['Ahmedabad', 'Anand', 'Mehsana', 'Surat'][index % 4]}));
const stores = Array.from({length: 200}, (_, index) => ({id: id('STORE-L', index + 1), name: `Retail Partner ${String(index + 1).padStart(3, '0')}`, district: ['West', 'North', 'East', 'South'][index % 4]}));
const batchCount = Math.ceil(rawLotCount / lotsPerBatch);
const batches = Array.from({length: batchCount}, (_, index) => ({id: id('PB-L', index + 1), startedAt: `2026-08-${String((index % 28) + 1).padStart(2, '0')}T${String(6 + (index % 12)).padStart(2, '0')}:00:00+05:30`}));
const rawLots = Array.from({length: rawLotCount}, (_, index) => {
  const number = index + 1;
  return {id: id('RML-L', number), farmId: farms[index % farmCount].id, batchId: batches[Math.floor(index / lotsPerBatch)].id, collectionDate: `2026-08-${String((index % 28) + 1).padStart(2, '0')}`, quantityLiters: 300 + (index % 650)};
});
const finishedLots = batches.flatMap((batch, index) => ['A', 'B', 'C'].map((split, splitIndex) => ({
  id: split === 'A' ? id('FL-L', index + 1) : `${id('FL-L', index + 1)}-${split}`,
  lotCode: `MILK-${String(index + 1).padStart(6, '0')}-${split}`,
  batchId: batch.id,
  shipmentId: split === 'A' ? id('SHP-L', index + 1) : `${id('SHP-L', index + 1)}-${split}`,
  storeId: stores[(index * 3 + splitIndex) % stores.length].id,
  productName: ['Fresh Milk 1L', 'Toned Milk 1L', 'Full Cream Milk 1L'][splitIndex]
})));

async function seedLarge() {
  const started = Date.now();
  console.log(`Preparing ${rawLotCount.toLocaleString()} raw lots, ${batchCount.toLocaleString()} batches, and ${finishedLots.length.toLocaleString()} finished lots.`);
  try { await write('CREATE CONSTRAINT entity_id_unique IF NOT EXISTS FOR (n:Entity) REQUIRE n.id IS UNIQUE'); } catch { /* Existing constraint or provider-specific DDL is safe to ignore. */ }
  await writeBatches('Farms', 'UNWIND $rows AS row MERGE (n:Farm:Entity {id: row.id}) SET n.name=row.name, n.region=row.region', farms);
  await writeBatches('Stores', 'UNWIND $rows AS row MERGE (n:Store:Location:Entity {id: row.id}) SET n.name=row.name, n.district=row.district', stores);
  await writeBatches('Processing batches', 'UNWIND $rows AS row MERGE (n:ProcessingBatch:Entity {id: row.id}) SET n.startedAt=row.startedAt, n.status="RELEASED"', batches);
  if (stage !== 'finished') await writeBatches('Raw milk lots', `UNWIND $rows AS row
    MERGE (raw:RawMilkLot:Lot:Entity {id: row.id})
    SET raw.collectionDate=row.collectionDate, raw.quantityLiters=row.quantityLiters, raw.qualityStatus='RELEASED'
    WITH raw,row MATCH (farm:Farm {id:row.farmId}) MATCH (batch:ProcessingBatch {id:row.batchId})
    MERGE (raw)-[:PRODUCED_AT]->(farm) MERGE (raw)-[:CONSUMED_IN]->(batch)`, rawLots);
  if (stage !== 'raw') await writeBatches('Finished lots and distribution', `UNWIND $rows AS row
    MERGE (finished:FinishedLot:Lot:Entity {id:row.id}) SET finished.lotCode=row.lotCode, finished.name=row.productName, finished.status='RELEASED'
    WITH finished,row MATCH (batch:ProcessingBatch {id:row.batchId}) MATCH (store:Store {id:row.storeId})
    MERGE (finished)-[:PACKAGED_IN]->(batch)
    MERGE (shipment:Shipment:Entity {id:row.shipmentId}) SET shipment.status='DELIVERED'
    MERGE (shipment)-[:CONTAINS]->(finished)
    MERGE (shipment)-[:SHIPPED_TO]->(store)`, finishedLots);
  console.log(`Large seed complete in ${((Date.now() - started) / 1000).toFixed(1)} seconds.`);
}

seedLarge().finally(() => driver?.close());
