import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const database = vi.hoisted(() => ({
  driver: {verifyConnectivity: vi.fn()},
  hasDatabaseConfig: true,
  read: vi.fn()
}));

vi.mock('./db.js', () => database);

import { buildApp } from './app.js';

describe('Dairy trace API', () => {
  let app: ReturnType<typeof buildApp>;

  beforeEach(async () => {
    vi.clearAllMocks();
    database.driver.verifyConnectivity.mockResolvedValue(undefined);
    database.read.mockResolvedValue([]);
    app = buildApp();
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  it('reports a healthy connected graph service', async () => {
    const response = await app.inject({method: 'GET', url: '/api/health'});

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({status: 'ok', database: 'connected'});
    expect(database.driver.verifyConnectivity).toHaveBeenCalledOnce();
  });

  it('returns a degraded status when the graph connection fails', async () => {
    database.driver.verifyConnectivity.mockRejectedValueOnce(new Error('network unavailable'));

    const response = await app.inject({method: 'GET', url: '/health'});

    expect(response.statusCode).toBe(503);
    expect(response.json()).toEqual({status: 'degraded', database: 'unavailable'});
  });

  it('passes entity search input as a Cypher parameter and serializes Neo4j integers', async () => {
    database.read.mockResolvedValueOnce([{id: 'FARM-014', labels: ['Farm'], display: 'Dairy Farm 014', liters: {toNumber: () => 280}}]);

    const response = await app.inject({method: 'GET', url: '/api/entities/search?q=FARM-014'});

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual([{id: 'FARM-014', labels: ['Farm'], display: 'Dairy Farm 014', liters: 280}]);
    expect(database.read).toHaveBeenCalledWith(expect.stringContaining('n.id = $term'), {term: 'FARM-014'});
  });

  it('uses the date-filtered static farm query with bound farm and date values', async () => {
    database.read.mockResolvedValueOnce([{farmId: 'FARM-014', collectionDate: '2026-08-10'}]);

    const response = await app.inject({method: 'GET', url: '/api/traces/farm/FARM-014?date=2026-08-10'});

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual([{farmId: 'FARM-014', collectionDate: '2026-08-10'}]);
    expect(database.read).toHaveBeenCalledWith(expect.stringContaining('WHERE raw.collectionDate = $date'), {
      farmId: 'FARM-014',
      date: '2026-08-10'
    });
  });

  it('uses the non-filtered static store query when no delivery date is supplied', async () => {
    const response = await app.inject({method: 'GET', url: '/api/traces/store/STORE-002'});

    expect(response.statusCode).toBe(200);
    const [cypher, params] = database.read.mock.calls[0] as [string, Record<string, unknown>];
    expect(cypher).not.toContain('WHERE delivery.arrivedOn = $date');
    expect(params).toEqual({storeId: 'STORE-002'});
  });

  it('returns a safe error without exposing database details', async () => {
    database.read.mockRejectedValueOnce(new Error('database unavailable'));

    const response = await app.inject({method: 'GET', url: '/api/traces/forward/RML-FARM-014-2026-08-10-AM'});

    expect(response.statusCode).toBe(500);
    expect(response.json()).toEqual({message: 'The trace service is temporarily unavailable. Please retry.'});
    expect(response.body).not.toContain('database unavailable');
  });
});
