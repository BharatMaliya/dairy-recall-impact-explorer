import type {Entity, TraceRow} from '../model/types';

const rows: TraceRow[] = [
  {
    batchId: 'PB-2026-08-10-TANK-01',
    rawLotId: 'RML-FARM-014-2026-08-10-AM',
    rawName: 'Morning collection',
    collectionDate: '2026-08-10',
    shift: 'AM',
    quantityLiters: 280,
    farmId: 'FARM-014',
    farmName: 'Dairy Farm 014',
    finishedLotId: 'FL-2PCT-2026-08-117-B',
    lotCode: '2PCT-2026-08-117-B',
    shipmentId: 'SHP-2026-08-10-001',
    storeId: 'STORE-001',
    storeName: 'Andheri Fresh Mart',
    storeArrivalDate: '2026-08-10'
  },
  {
    batchId: 'PB-2026-08-10-TANK-01',
    rawLotId: 'RML-FARM-014-2026-08-10-AM',
    rawName: 'Morning collection',
    collectionDate: '2026-08-10',
    shift: 'AM',
    quantityLiters: 280,
    farmId: 'FARM-014',
    farmName: 'Dairy Farm 014',
    finishedLotId: 'FL-2PCT-2026-08-118-C',
    lotCode: '2PCT-2026-08-118-C',
    shipmentId: 'SHP-2026-08-10-002',
    storeId: 'STORE-002',
    storeName: 'Bandra Daily Needs',
    storeArrivalDate: '2026-08-10'
  },
  {
    batchId: 'PB-2026-08-10-TANK-01',
    rawLotId: 'RML-FARM-021-2026-08-10-AM',
    rawName: 'Shared tanker collection',
    collectionDate: '2026-08-10',
    shift: 'AM',
    quantityLiters: 340,
    farmId: 'FARM-021',
    farmName: 'Dairy Farm 021',
    finishedLotId: 'FL-2PCT-2026-08-117-B',
    lotCode: '2PCT-2026-08-117-B',
    shipmentId: 'SHP-2026-08-10-001',
    storeId: 'STORE-001',
    storeName: 'Andheri Fresh Mart',
    storeArrivalDate: '2026-08-10'
  },
  {
    batchId: 'PB-2026-08-10-TANK-01',
    rawLotId: 'RML-FARM-021-2026-08-10-AM',
    rawName: 'Shared tanker collection',
    collectionDate: '2026-08-10',
    shift: 'AM',
    quantityLiters: 340,
    farmId: 'FARM-021',
    farmName: 'Dairy Farm 021',
    finishedLotId: 'FL-2PCT-2026-08-118-C',
    lotCode: '2PCT-2026-08-118-C',
    shipmentId: 'SHP-2026-08-10-002',
    storeId: 'STORE-002',
    storeName: 'Bandra Daily Needs',
    storeArrivalDate: '2026-08-10'
  }
];

const entities: Entity[] = [
  {id: 'FARM-014', labels: ['Entity', 'Farm'], display: 'Dairy Farm 014'},
  {id: 'FARM-021', labels: ['Entity', 'Farm'], display: 'Dairy Farm 021'},
  {id: 'STORE-001', labels: ['Entity', 'Store'], display: 'Andheri Fresh Mart'},
  {id: 'STORE-002', labels: ['Entity', 'Store'], display: 'Bandra Daily Needs'},
  {id: 'RML-FARM-014-2026-08-10-AM', labels: ['Entity', 'RawMilkLot'], display: 'RML-FARM-014-2026-08-10-AM'},
  {id: 'RML-FARM-021-2026-08-10-AM', labels: ['Entity', 'RawMilkLot'], display: 'RML-FARM-021-2026-08-10-AM'},
  {id: 'FL-2PCT-2026-08-117-B', labels: ['Entity', 'FinishedLot'], display: '2PCT-2026-08-117-B'},
  {id: 'FL-2PCT-2026-08-118-C', labels: ['Entity', 'FinishedLot'], display: '2PCT-2026-08-118-C'},
  {id: 'PB-2026-08-10-TANK-01', labels: ['Entity', 'ProcessingBatch'], display: 'PB-2026-08-10-TANK-01'}
];

const matches = (value: string, term: string) => value.toLowerCase().includes(term.toLowerCase());
const byDate = (date: string) => (row: TraceRow) => row.collectionDate === date || row.storeArrivalDate === date;

export const demoTraceData = {
  searchEntities(term: string): Entity[] {
    return entities.filter((entity) => matches(entity.id, term) || matches(entity.display, term));
  },
  farm(farmId: string, collectionDate: string): TraceRow[] {
    return rows.filter((row) => row.farmId === farmId && byDate(collectionDate)(row));
  },
  store(storeId: string, deliveryDate: string): TraceRow[] {
    return rows.filter((row) => row.storeId === storeId && byDate(deliveryDate)(row));
  },
  forward(rawLotId: string): TraceRow[] {
    return rows.filter((row) => row.rawLotId === rawLotId);
  },
  reverse(finishedLotId: string): TraceRow[] {
    return rows.filter((row) => row.finishedLotId === finishedLotId);
  },
  batch(batchId: string): TraceRow[] {
    return rows.filter((row) => row.batchId === batchId);
  }
};
