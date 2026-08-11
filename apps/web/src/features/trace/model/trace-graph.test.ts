import { describe, expect, it } from 'vitest';
import { buildNetworkTrace } from './trace-graph';
import type { TraceRow } from './types';

const row = (overrides: Partial<TraceRow> = {}): TraceRow => ({
  batchId: 'PB-001',
  rawLotId: 'RML-001',
  rawName: 'AM collection',
  collectionDate: '2026-08-10',
  shift: 'AM',
  quantityLiters: 280,
  farmId: 'FARM-001',
  farmName: 'Dairy Farm 001',
  finishedLotId: 'FL-001',
  lotCode: 'FRESH-0001',
  shipmentId: 'SHP-001',
  storeId: 'STORE-001',
  storeName: 'Ahmedabad retail store',
  storeArrivalDate: '2026-08-12',
  ...overrides
});

describe('buildNetworkTrace', () => {
  it('builds a directed farm-to-store evidence path', () => {
    const trace = buildNetworkTrace('downstream-impact', 'Farm trace', 'Trace explanation', [row()]);

    expect(trace.nodes.map((node) => node.id)).toEqual(['FARM-001', 'RML-001', 'PB-001', 'FL-001', 'STORE-001']);
    expect(trace.edges).toHaveLength(4);
    expect(trace.edges.map((edge) => `${edge.source}->${edge.target}`)).toEqual([
      'FARM-001->RML-001',
      'RML-001->PB-001',
      'PB-001->FL-001',
      'FL-001->STORE-001'
    ]);
    expect(trace.facts[0]).toContain('1 time-stamped raw collection from 1 farm');
  });

  it('collapses large farm and raw-lot result sets while retaining the evidence edges', () => {
    const rows = Array.from({length: 21}, (_, index) => row({
      farmId: `FARM-${String(index + 1).padStart(3, '0')}`,
      farmName: `Dairy Farm ${String(index + 1).padStart(3, '0')}`,
      rawLotId: `RML-${String(index + 1).padStart(3, '0')}`,
      finishedLotId: `FL-${String(index + 1).padStart(3, '0')}`,
      lotCode: `FRESH-${String(index + 1).padStart(4, '0')}`
    }));

    const trace = buildNetworkTrace('farmer-source', 'Store trace', 'Trace explanation', rows);

    expect(trace.nodes.find((node) => node.id === 'aggregate-farm')?.data).toMatchObject({title: '21 milk producers'});
    expect(trace.nodes.find((node) => node.id === 'aggregate-raw')?.data).toMatchObject({title: '21 raw milk collections'});
    expect(trace.edges.some((edge) => edge.source === 'aggregate-farm' && edge.target === 'aggregate-raw')).toBe(true);
    // All five categories collapse in this synthetic 21-row case, so duplicate
    // evidence paths become four aggregate-to-aggregate edges.
    expect(trace.edges).toHaveLength(4);
  });

  it('rejects an empty evidence result', () => {
    expect(() => buildNetworkTrace('in-process', 'Empty trace', 'Trace explanation', [])).toThrow('No time-matched evidence exists');
  });
});
