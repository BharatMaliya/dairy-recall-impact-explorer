import type { Entity, TraceRow } from '../model/types';
import {demoTraceData} from './demo-trace-data';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001';
const useDemoFallback = import.meta.env.VITE_DEMO_TRACE_FALLBACK !== 'false';

function apiUrl(path: string) {
  return `${apiBaseUrl.replace(/\/$/, '')}${path}`;
}

async function getJson<T>(path: string, fallback: () => T): Promise<T> {
  let response: Response;
  try {
    response = await fetch(apiUrl(path));
  } catch (error) {
    if (useDemoFallback) return fallback();
    throw error;
  }
  if (!response.ok) throw new Error('No matching trace was found.');
  return response.json() as Promise<T>;
}

async function wakeApi(): Promise<void> {
  const response = await fetch(apiUrl('/api/health'), {cache: 'no-store'});
  if (!response.ok) throw new Error('Trace API is unavailable.');
}

export const traceApi = {
  wake: wakeApi,
  searchEntities: (term: string) => getJson<Entity[]>(`/api/entities/search?q=${encodeURIComponent(term)}`, () => demoTraceData.searchEntities(term)),
  farm: (farmId: string, collectionDate: string) => getJson<TraceRow[]>(`/api/traces/farm/${farmId}?date=${encodeURIComponent(collectionDate)}`, () => demoTraceData.farm(farmId, collectionDate)),
  store: (storeId: string, deliveryDate: string) => getJson<TraceRow[]>(`/api/traces/store/${storeId}?date=${encodeURIComponent(deliveryDate)}`, () => demoTraceData.store(storeId, deliveryDate)),
  forward: (rawLotId: string) => getJson<TraceRow[]>(`/api/traces/forward/${rawLotId}`, () => demoTraceData.forward(rawLotId)),
  reverse: (finishedLotId: string) => getJson<TraceRow[]>(`/api/traces/reverse/${finishedLotId}`, () => demoTraceData.reverse(finishedLotId)),
  batch: (batchId: string) => getJson<TraceRow[]>(`/api/traces/batch/${batchId}`, () => demoTraceData.batch(batchId))
};
