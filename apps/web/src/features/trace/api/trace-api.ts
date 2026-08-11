import type { Entity, TraceRow } from '../model/types';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001';

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`);
  if (!response.ok) throw new Error('No matching trace was found.');
  return response.json() as Promise<T>;
}

export const traceApi = {
  searchEntities: (term: string) => getJson<Entity[]>(`/api/entities/search?q=${encodeURIComponent(term)}`),
  farm: (farmId: string, collectionDate: string) => getJson<TraceRow[]>(`/api/traces/farm/${farmId}?date=${encodeURIComponent(collectionDate)}`),
  store: (storeId: string, deliveryDate: string) => getJson<TraceRow[]>(`/api/traces/store/${storeId}?date=${encodeURIComponent(deliveryDate)}`),
  forward: (rawLotId: string) => getJson<TraceRow[]>(`/api/traces/forward/${rawLotId}`),
  reverse: (finishedLotId: string) => getJson<TraceRow[]>(`/api/traces/reverse/${finishedLotId}`),
  batch: (batchId: string) => getJson<TraceRow[]>(`/api/traces/batch/${batchId}`)
};
