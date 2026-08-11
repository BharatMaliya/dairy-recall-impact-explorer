import { driver, write } from './db.js';

type NodeSeed = {label: string; id: string; properties: Record<string, unknown>};
type RelationshipSeed = {type: string; from: string; to: string; properties?: Record<string, unknown>};

const nodes: NodeSeed[] = [
  {label: 'Farm', id: 'FARM-014', properties: {name: 'Shakti Farm Collective', region: 'Ahmedabad'}},
  {label: 'CollectionCenter', id: 'CC-03', properties: {name: 'Bopal Collection Centre'}},
  {label: 'StorageTank', id: 'TANK-RT-12', properties: {name: 'Raw Tank RT-12'}},
  {label: 'ProcessingLine', id: 'LINE-P2', properties: {name: 'Pasteurisation Line 2'}},
  {label: 'RawMilkLot', id: 'RML-2026-08-041-A', properties: {collectionDate: '2026-08-04', quantityLiters: 1200, qualityStatus: 'UNDER_REVIEW'}},
  {label: 'RawMilkLot', id: 'RML-2026-08-041-B', properties: {collectionDate: '2026-08-04', quantityLiters: 950, qualityStatus: 'UNDER_REVIEW'}},
  {label: 'RawMilkLot', id: 'RML-2026-08-041-C', properties: {collectionDate: '2026-08-04', quantityLiters: 880, qualityStatus: 'UNDER_REVIEW'}},
  {label: 'ProcessingBatch', id: 'PB-2026-08-117', properties: {name: '2% milk batch 117', status: 'UNDER_REVIEW'}},
  {label: 'ProcessingBatch', id: 'PB-2026-08-118', properties: {name: '2% milk batch 118', status: 'UNDER_REVIEW'}},
  {label: 'ProcessingBatch', id: 'PB-2026-08-119', properties: {name: 'Toned milk batch 119', status: 'UNDER_REVIEW'}},
  {label: 'FinishedLot', id: 'FL-2PCT-2026-08-117-B', properties: {lotCode: 'AMUL-2PCT-117-B', name: '2% Milk 1L', status: 'CANDIDATE_IMPACT'}},
  {label: 'FinishedLot', id: 'FL-2PCT-2026-08-118-A', properties: {lotCode: 'AMUL-2PCT-118-A', name: '2% Milk 1L', status: 'CANDIDATE_IMPACT'}},
  {label: 'FinishedLot', id: 'FL-TONED-2026-08-119-A', properties: {lotCode: 'AMUL-TONED-119-A', name: 'Toned Milk 1L', status: 'CANDIDATE_IMPACT'}},
  {label: 'ServiceArea', id: 'AREA-AHMEDABAD-W-01', properties: {name: 'Ahmedabad West service area'}},
  {label: 'Store', id: 'STORE-118', properties: {name: 'West Ahmedabad Retail Partner'}},
  {label: 'Shipment', id: 'SHP-2026-08-118-04', properties: {name: 'Ahmedabad West shipment', status: 'DELIVERED'}},
  {label: 'CustomerComplaint', id: 'CMP-2026-0081', properties: {receivedAt: '2026-08-06T09:00:00+05:30', productDescription: '2% milk 1L', category: 'OFF_ODOR', resolutionStatus: 'RESOLVED'}},
  {label: 'CustomerComplaint', id: 'CMP-2026-0082', properties: {receivedAt: '2026-08-06T10:00:00+05:30', productDescription: '2% milk 1L', category: 'OFF_ODOR', resolutionStatus: 'RESOLVED'}},
  {label: 'CustomerComplaint', id: 'CMP-2026-0083', properties: {receivedAt: '2026-08-06T11:00:00+05:30', productDescription: '2% milk 1L', category: 'OFF_ODOR', resolutionStatus: 'RESOLVED'}},
  {label: 'CustomerComplaint', id: 'CMP-2026-0084', properties: {productDescription: '2% milk 1L', resolutionStatus: 'UNRESOLVED'}},
  {label: 'User', id: 'USR-PRIYA', properties: {displayName: 'Priya Shah', role: 'QUALITY_MANAGER'}},
  {label: 'Investigation', id: 'INV-2026-014', properties: {title: 'Off-odor complaints: 2% milk', triggerType: 'CUSTOMER_COMPLAINT', status: 'UNDER_REVIEW'}},
  {label: 'Investigation', id: 'INV-2026-015', properties: {title: 'Farmer self-report: FARM-014 collection', triggerType: 'FARMER_SELF_REPORT', status: 'UNDER_REVIEW'}},
  {label: 'FarmerDisclosure', id: 'FDR-2026-0011', properties: {concernType: 'POSSIBLE_CONTAMINATION', verificationStatus: 'RESOLVED'}}
];

const relationships: RelationshipSeed[] = [
  {type: 'PRODUCED_AT', from: 'RML-2026-08-041-A', to: 'FARM-014', properties: {collectedAt: '2026-08-04T05:30:00+05:30'}},
  {type: 'COLLECTED_AT', from: 'RML-2026-08-041-A', to: 'CC-03', properties: {receivedAt: '2026-08-04T06:15:00+05:30'}},
  {type: 'STORED_IN', from: 'RML-2026-08-041-A', to: 'TANK-RT-12', properties: {startedAt: '2026-08-04T08:00:00+05:30', endedAt: '2026-08-04T10:00:00+05:30'}},
  {type: 'STORED_IN', from: 'RML-2026-08-041-B', to: 'TANK-RT-12', properties: {startedAt: '2026-08-04T09:00:00+05:30', endedAt: '2026-08-04T11:00:00+05:30'}},
  {type: 'STORED_IN', from: 'RML-2026-08-041-C', to: 'TANK-RT-12', properties: {startedAt: '2026-08-04T09:30:00+05:30', endedAt: '2026-08-04T11:30:00+05:30'}},
  {type: 'CONSUMED_IN', from: 'RML-2026-08-041-A', to: 'PB-2026-08-117', properties: {consumedAt: '2026-08-04T10:30:00+05:30', quantity: 1200}},
  {type: 'CONSUMED_IN', from: 'RML-2026-08-041-B', to: 'PB-2026-08-118', properties: {consumedAt: '2026-08-04T11:30:00+05:30', quantity: 950}},
  {type: 'CONSUMED_IN', from: 'RML-2026-08-041-C', to: 'PB-2026-08-119', properties: {consumedAt: '2026-08-04T12:00:00+05:30', quantity: 880}},
  {type: 'RAN_ON', from: 'PB-2026-08-117', to: 'LINE-P2'},
  {type: 'PACKAGED_IN', from: 'FL-2PCT-2026-08-117-B', to: 'PB-2026-08-117', properties: {packagedAt: '2026-08-04T12:00:00+05:30'}},
  {type: 'PACKAGED_IN', from: 'FL-2PCT-2026-08-118-A', to: 'PB-2026-08-118', properties: {packagedAt: '2026-08-04T13:00:00+05:30'}},
  {type: 'PACKAGED_IN', from: 'FL-TONED-2026-08-119-A', to: 'PB-2026-08-119', properties: {packagedAt: '2026-08-04T13:30:00+05:30'}},
  {type: 'CONTAINS', from: 'SHP-2026-08-118-04', to: 'FL-2PCT-2026-08-117-B', properties: {quantity: 900, uom: 'units'}},
  {type: 'SHIPPED_TO', from: 'SHP-2026-08-118-04', to: 'STORE-118'}, {type: 'SERVES', from: 'STORE-118', to: 'AREA-AHMEDABAD-W-01'},
  ...['CMP-2026-0081', 'CMP-2026-0082', 'CMP-2026-0083', 'CMP-2026-0084'].map((from) => ({type: 'REPORTED_FROM', from, to: 'AREA-AHMEDABAD-W-01'})),
  ...['CMP-2026-0081', 'CMP-2026-0082', 'CMP-2026-0083'].map((from) => ({type: 'REPORTED_AGAINST', from, to: 'FL-2PCT-2026-08-117-B'})),
  {type: 'OWNS', from: 'USR-PRIYA', to: 'INV-2026-014'}, {type: 'OWNS', from: 'USR-PRIYA', to: 'INV-2026-015'},
  {type: 'HAS_ANCHOR', from: 'INV-2026-014', to: 'FL-2PCT-2026-08-117-B'}, {type: 'HAS_ANCHOR', from: 'INV-2026-015', to: 'RML-2026-08-041-A'},
  {type: 'REPORTED_BY', from: 'FDR-2026-0011', to: 'FARM-014'}, {type: 'IDENTIFIES', from: 'FDR-2026-0011', to: 'RML-2026-08-041-A'}, {type: 'HAS_DISCLOSURE', from: 'INV-2026-015', to: 'FDR-2026-0011'}
];

const nodeQuery: Record<string, string> = Object.fromEntries([...new Set(nodes.map((node) => node.label))].map((label) => [label, `MERGE (n:${label}:Entity {id:$id}) SET n += $properties`]));
const relationshipQuery: Record<string, string> = Object.fromEntries([...new Set(relationships.map((relationship) => relationship.type))].map((type) => [type, `MATCH (from:Entity {id:$from}), (to:Entity {id:$to}) MERGE (from)-[r:${type}]->(to) SET r += $properties`]));

async function seed() {
  try { await write('CREATE CONSTRAINT entity_id_unique IF NOT EXISTS FOR (n:Entity) REQUIRE n.id IS UNIQUE'); } catch { /* Existing or unsupported DDL must not block the demo seed. */ }
  for (const node of nodes) await write(nodeQuery[node.label], {id: node.id, properties: node.properties});
  for (const relationship of relationships) await write(relationshipQuery[relationship.type], {from: relationship.from, to: relationship.to, properties: relationship.properties ?? {}});
  console.log('Seed complete: complaint and farmer-led recall demo data is ready.');
}

seed().finally(() => driver?.close());
