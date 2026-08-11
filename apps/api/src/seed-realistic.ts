import { driver, write } from './db.js';

const days = Number(process.env.SEED_DAYS ?? 15);
const batchSize = 250;
const batches = <T>(rows: T[]) => Array.from({length: Math.ceil(rows.length / batchSize)}, (_, index) => rows.slice(index * batchSize, index * batchSize + batchSize));
const day = (offset: number) => new Date(Date.UTC(2026, 7, 1 + offset)).toISOString().slice(0, 10);
const run = async (name: string, cypher: string, rows: unknown[]) => { for (const chunk of batches(rows)) await write(cypher, {rows: chunk}); console.log(`${name}: ${rows.length.toLocaleString()}`); };

if (!Number.isInteger(days) || days < 1 || days > 365) throw new Error('SEED_DAYS must be between 1 and 365.');

const centerSizes = [10, 9, 9, 9, 8, 8, 8, 8, 8, 8, 8, 7];
const centers = centerSizes.map((farmLimit, index) => ({id: `CC-${String(index + 1).padStart(2, '0')}`, name: `Collection Centre ${index + 1}`, farmLimit, tankId: `TANK-${String([1, 1, 1, 2, 2, 2, 3, 3, 4, 4, 5, 5][index]).padStart(2, '0')}`}));
const tanks = Array.from({length: 5}, (_, index) => ({id: `TANK-${String(index + 1).padStart(2, '0')}`, name: `Bulk storage tank ${index + 1}`, capacityLiters: 18000}));
const vehicles = Array.from({length: 8}, (_, index) => ({id: `VEH-${String(index + 1).padStart(2, '0')}`, name: `Insulated milk tanker ${index + 1}`}));
const stores = Array.from({length: 5}, (_, index) => ({id: `STORE-${String(index + 1).padStart(3, '0')}`, name: ['Navrangpura', 'Bopal', 'Maninagar', 'Vastrapur', 'Satellite'][index] + ' retail store'}));
let farmSerial = 0;
const farms = centerSizes.flatMap((size, centerIndex) => Array.from({length: size}, () => { farmSerial += 1; return {id: `FARM-${String(farmSerial).padStart(3, '0')}`, name: `Dairy Farm ${String(farmSerial).padStart(3, '0')}`, centerId: centers[centerIndex].id, tankId: centers[centerIndex].tankId, vehicleId: vehicles[centerIndex % vehicles.length].id}; }));
const processBatches = Array.from({length: days * tanks.length}, (_, index) => ({id: `PB-${day(Math.floor(index / tanks.length))}-${tanks[index % tanks.length].id}`, tankId: tanks[index % tanks.length].id, startedAt: `${day(Math.floor(index / tanks.length))}T18:00:00+05:30`}));
const rawLots = farms.flatMap((farm) => {
  const farmLots = Array.from(
    {length: days},
    (_, dayIndex) => ['AM', 'PM'].map((shift, shiftIndex) => ({
      id: `RML-${farm.id}-${day(dayIndex)}-${shift}`,
      name: `${shift === 'AM' ? 'Morning' : 'Evening'} collection · ${day(dayIndex)}`,
      shift, farmId: farm.id, centerId: farm.centerId, tankId: farm.tankId, vehicleId: farm.vehicleId,
      batchId: `PB-${day(dayIndex)}-${farm.tankId}`, collectionDate: day(dayIndex),
      collectedAt: `${day(dayIndex)}T${shiftIndex ? '16:30' : '05:30'}:00+05:30`,
      quantityLiters: 180 + ((dayIndex * 17 + shiftIndex * 31 + Number(farm.id.slice(-3))) % 240)
    }))
  );
  return farmLots.flat();
});
const finishedLots = processBatches.flatMap((batch, index) => ['FRESH', 'TONED', 'CREAM'].map((product, productIndex) => ({id: `FL-${batch.id}-${product}`, lotCode: `${product}-${String(index + 1).padStart(5, '0')}`, batchId: batch.id, shipmentId: `SHP-${String(index + 1).padStart(5, '0')}-${product}`, storeId: stores[(index + productIndex) % stores.length].id, packagedAt: `${day(Math.floor(index / tanks.length) + 1)}T09:00:00+05:30`, product})));

async function seed() {
  console.log(`Creating ${farms.length} farms, ${rawLots.length.toLocaleString()} daily raw lots, and ${finishedLots.length.toLocaleString()} finished lots over ${days} days.`);
  try { await write('CREATE CONSTRAINT entity_id_unique IF NOT EXISTS FOR (n:Entity) REQUIRE n.id IS UNIQUE'); } catch { /* provider-specific schema handling */ }
  await run('Collection centres', 'UNWIND $rows AS row MERGE (n:CollectionCenter:Location:Entity {id:row.id}) SET n.name=row.name,n.farmLimit=row.farmLimit,n.tankId=row.tankId', centers);
  await run('Storage tanks', 'UNWIND $rows AS row MERGE (n:StorageTank:Equipment:Entity {id:row.id}) SET n.name=row.name,n.capacityLiters=row.capacityLiters', tanks);
  await run('Tankers', 'UNWIND $rows AS row MERGE (n:Vehicle:Entity {id:row.id}) SET n.name=row.name', vehicles);
  await run('Stores', 'UNWIND $rows AS row MERGE (n:Store:Location:Entity {id:row.id}) SET n.name=row.name', stores);
  await run('Farms', 'UNWIND $rows AS row MERGE (n:Farm:Entity {id:row.id}) SET n.name=row.name WITH n,row MATCH (cc:CollectionCenter {id:row.centerId}) MERGE (n)-[:ASSIGNED_TO]->(cc)', farms);
  await run('Processing batches', 'UNWIND $rows AS row MERGE (n:ProcessingBatch:Entity {id:row.id}) SET n.startedAt=row.startedAt,n.status="RELEASED" WITH n,row MATCH (tank:StorageTank {id:row.tankId}) MERGE (n)-[:RAN_FROM]->(tank)', processBatches);
  await run('Daily raw-milk lots', `UNWIND $rows AS row MERGE (raw:Entity {id:row.id}) SET raw:RawMilkLot:Lot,raw.name=row.name,raw.shift=row.shift,raw.collectionDate=row.collectionDate,raw.collectedAt=row.collectedAt,raw.quantityLiters=row.quantityLiters,raw.qualityStatus='RELEASED'`, rawLots);
  await run('Farm provenance links', `UNWIND $rows AS row MATCH (raw:RawMilkLot {id:row.id}) MATCH (farm:Farm {id:row.farmId}) MERGE (raw)-[:PRODUCED_AT {collectedAt:row.collectedAt,quantityLiters:row.quantityLiters}]->(farm)`, rawLots);
  await run('Collection-centre receipt links', `UNWIND $rows AS row MATCH (raw:RawMilkLot {id:row.id}) MATCH (cc:CollectionCenter {id:row.centerId}) MERGE (raw)-[:COLLECTED_AT {receivedAt:row.collectedAt}]->(cc)`, rawLots);
  await run('Tanker custody links', `UNWIND $rows AS row MATCH (raw:RawMilkLot {id:row.id}) MATCH (vehicle:Vehicle {id:row.vehicleId}) MERGE (raw)-[:LOADED_ON {loadedAt:row.collectedAt}]->(vehicle)`, rawLots);
  await run('Storage-tank links', `UNWIND $rows AS row MATCH (raw:RawMilkLot {id:row.id}) MATCH (tank:StorageTank {id:row.tankId}) MERGE (raw)-[:STORED_IN {startedAt:row.collectedAt}]->(tank)`, rawLots);
  await run('Batch-consumption links', `UNWIND $rows AS row MATCH (raw:RawMilkLot {id:row.id}) MATCH (batch:ProcessingBatch {id:row.batchId}) MERGE (raw)-[:CONSUMED_IN {consumedAt:row.collectedAt,quantityLiters:row.quantityLiters}]->(batch)`, rawLots);
  await run('Finished lots', `UNWIND $rows AS row MERGE (finished:FinishedLot:Lot:Entity {id:row.id}) SET finished.lotCode=row.lotCode,finished.product=row.product,finished.packagedAt=row.packagedAt,finished.status='RELEASED'`, finishedLots);
  await run('Packaging links', `UNWIND $rows AS row MATCH (finished:FinishedLot {id:row.id}) MATCH (batch:ProcessingBatch {id:row.batchId}) MERGE (finished)-[:PACKAGED_IN {packagedAt:row.packagedAt}]->(batch)`, finishedLots);
  await run('Shipments', `UNWIND $rows AS row MERGE (shipment:Shipment:Entity {id:row.shipmentId}) SET shipment.departedAt=row.packagedAt,shipment.status='DELIVERED'`, finishedLots);
  await run('Shipment contents', `UNWIND $rows AS row MATCH (shipment:Shipment {id:row.shipmentId}) MATCH (finished:FinishedLot {id:row.id}) MERGE (shipment)-[:CONTAINS]->(finished)`, finishedLots);
  await run('Store delivery links', `UNWIND $rows AS row MATCH (shipment:Shipment {id:row.shipmentId}) MATCH (store:Store {id:row.storeId}) MERGE (shipment)-[:SHIPPED_TO {arrivedAt:row.packagedAt}]->(store)`, finishedLots);
  console.log('Realistic time-aware seed complete.');
}

seed().finally(() => driver?.close());
