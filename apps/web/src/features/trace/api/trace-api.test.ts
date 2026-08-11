import {afterEach, describe, expect, it, vi} from 'vitest';
import {traceApi} from './trace-api';

describe('trace API client', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('encodes search and date values before requesting trace endpoints', async () => {
    const fetch = vi.fn().mockResolvedValue({ok: true, json: async () => []});
    vi.stubGlobal('fetch', fetch);

    await traceApi.searchEntities('FARM 014');
    await traceApi.farm('FARM-014', '2026-08-10');

    expect(fetch).toHaveBeenNthCalledWith(1, 'http://localhost:3001/api/entities/search?q=FARM%20014');
    expect(fetch).toHaveBeenNthCalledWith(2, 'http://localhost:3001/api/traces/farm/FARM-014?date=2026-08-10');
  });

  it('warms the API with a non-cached health request', async () => {
    const fetch = vi.fn().mockResolvedValue({ok: true});
    vi.stubGlobal('fetch', fetch);

    await traceApi.wake();

    expect(fetch).toHaveBeenCalledWith('http://localhost:3001/api/health', {cache: 'no-store'});
  });

  it('rejects a non-success API response with a user-safe message', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ok: false}));

    await expect(traceApi.forward('RML-001')).rejects.toThrow('No matching trace was found.');
  });
});
