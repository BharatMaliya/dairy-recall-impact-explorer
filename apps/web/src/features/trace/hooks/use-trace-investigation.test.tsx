import {act, renderHook} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';

const traceApi = vi.hoisted(() => ({
  searchEntities: vi.fn(),
  farm: vi.fn(),
  store: vi.fn(),
  forward: vi.fn(),
  reverse: vi.fn(),
  batch: vi.fn()
}));

vi.mock('../api/trace-api', () => ({traceApi}));

import {useTraceInvestigation} from './use-trace-investigation';

describe('useTraceInvestigation', () => {
  it('selects a farm route and builds a forward candidate-impact trace', async () => {
    traceApi.searchEntities.mockResolvedValue([{id: 'FARM-014', labels: ['Farm'], display: 'Dairy Farm 014'}]);
    traceApi.farm.mockResolvedValue([{
      batchId: 'PB-001', rawLotId: 'RML-001', rawName: 'Morning collection', collectionDate: '2026-08-10', shift: 'AM', quantityLiters: 280,
      farmId: 'FARM-014', farmName: 'Dairy Farm 014', finishedLotId: 'FL-001', lotCode: 'FRESH-0001', shipmentId: 'SHP-001', storeId: 'STORE-001', storeName: 'Retail store', storeArrivalDate: '2026-08-12'
    }]);
    const {result} = renderHook(() => useTraceInvestigation());

    await act(async () => result.current.explore('FARM-014', '2026-08-10'));

    expect(traceApi.farm).toHaveBeenCalledWith('FARM-014', '2026-08-10');
    expect(result.current.trace.kind).toBe('downstream-impact');
    expect(result.current.trace.nodes.map((node) => node.id)).toContain('STORE-001');
  });

  it('exposes a safe user error when the entity cannot be resolved', async () => {
    traceApi.searchEntities.mockResolvedValue([]);
    const {result} = renderHook(() => useTraceInvestigation());

    await act(async () => result.current.explore('UNKNOWN-LOT', '2026-08-10'));

    expect(result.current.error).toBe('No matching farm, store, lot, or batch was found.');
  });
});
