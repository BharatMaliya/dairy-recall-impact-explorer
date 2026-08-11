import type { Trace, TraceSample } from './types';

export const defaultTraceDate = '2026-08-10';

export const initialTrace: Trace = {
  kind: 'farmer-source',
  title: 'Trace a real collection or recall path',
  explanation: 'Search a farm with a collection date, a store to see its possible farm sources, or a raw/finished lot or processing batch.',
  facts: [
    'Farm + date: FARM-014 on 10 Aug 2026',
    'Store + date: STORE-001 on 10 Aug 2026',
    'Raw lot: RML-FARM-014-2026-08-10-AM'
  ],
  nodes: [],
  edges: []
};

export const loadingTrace: Trace = {
  kind: 'in-process',
  title: 'Tracing supply-chain evidence',
  explanation: 'Loading the latest investigation path…',
  facts: [],
  nodes: [],
  edges: []
};

export const traceSamples: TraceSample[] = [
  {id: 'FARM-014', date: defaultTraceDate, label: 'FARM-014 · collected 10 Aug'},
  {id: 'STORE-002', date: defaultTraceDate, label: 'STORE-002 · delivered 10 Aug'},
  {id: 'RML-FARM-014-2026-08-10-AM', date: defaultTraceDate, label: 'Raw lot · FARM-014'},
  {id: 'PB-2026-08-10-TANK-01', date: defaultTraceDate, label: 'Batch · TANK-01'}
];
