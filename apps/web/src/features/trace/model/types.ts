import type {Edge, Node} from '@xyflow/react';

export type Entity = {
  id: string;
  labels: string[];
  display: string;
};

export type TraceRow = {
  batchId: string;
  rawLotId: string;
  rawName: string;
  collectionDate: string;
  shift: string;
  quantityLiters: number;
  farmId: string;
  farmName: string;
  finishedLotId: string;
  lotCode: string;
  shipmentId: string;
  storeId: string;
  storeName: string;
  storeArrivalDate?: string | null;
};

export type TraceKind = 'farmer-source' | 'downstream-impact' | 'in-process';
export type GroupKey = 'farm' | 'raw' | 'batch' | 'finished' | 'store';

export type AggregateNodeData = {
  title: string;
  detail: string;
  items: string[];
};

export type Trace = {
  kind: TraceKind;
  title: string;
  explanation: string;
  nodes: Node[];
  edges: Edge[];
  facts: string[];
};

export type TraceSample = {
  id: string;
  date: string;
  label: string;
};
