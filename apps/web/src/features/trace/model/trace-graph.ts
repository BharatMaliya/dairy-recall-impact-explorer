import { MarkerType, type Edge, type Node } from '@xyflow/react';
import { readableDate } from './format';
import type { AggregateNodeData, GroupKey, Trace, TraceKind, TraceRow } from './types';

const nodeLimit = 20;
const arrow = {type: MarkerType.ArrowClosed};
const point = (column: number, index: number) => ({x: 24 + column * 360, y: 28 + index * 122});

const unique = <T,>(items: T[]) => [...new Set(items)];
const dedupeNodes = (nodes: Node[]) => [...new Map(nodes.map((node) => [node.id, node])).values()];
const dedupeEdges = (edges: Edge[]) => [...new Map(edges.map((edge) => [edge.id, edge])).values()];

export function buildNetworkTrace(kind: TraceKind, title: string, explanation: string, rows: TraceRow[]): Trace {
  if (!rows.length) throw new Error('No time-matched evidence exists for that search. Try a date between 1–15 August 2026.');

  const farmIds = unique(rows.map((row) => row.farmId));
  const rawIds = unique(rows.map((row) => row.rawLotId));
  const batches = unique(rows.map((row) => row.batchId));
  const finishedLots = unique(rows.map((row) => row.finishedLotId));
  const stores = unique(rows.filter((row) => row.storeId).map((row) => row.storeId));
  const byId = (id: string, key: keyof TraceRow) => rows.find((row) => row[key] === id)!;
  const isCollapsed = (ids: string[]) => ids.length > nodeLimit;
  const aggregateId = (group: GroupKey) => `aggregate-${group}`;
  const visibleId = (group: GroupKey, id: string, ids: string[]) => isCollapsed(ids) ? aggregateId(group) : id;
  const aggregateNode = (group: GroupKey, count: number, column: number, noun: string, items: string[]): Node<AggregateNodeData, 'aggregate'> => ({
    id: aggregateId(group),
    type: 'aggregate',
    position: point(column, 2),
    className: 'aggregate',
    data: {
      title: `${count} ${noun}`,
      detail: `This category is collapsed above ${nodeLimit} nodes.`,
      items
    }
  });

  const nodes: Node[] = [
    ...(isCollapsed(farmIds)
      ? [aggregateNode('farm', farmIds.length, 0, 'milk producers', farmIds.map((id) => {
        const row = byId(id, 'farmId');
        return `${row.farmName} · ${id}`;
      }))]
      : farmIds.map((id, index) => {
        const row = byId(id, 'farmId');
        return {id, position: point(0, index), data: {label: `Milk producer\n${row.farmName}\n${id}`}, className: 'source'};
      })),
    ...(isCollapsed(rawIds)
      ? [aggregateNode('raw', rawIds.length, 1, 'raw milk collections', rawIds.map((id) => {
        const row = byId(id, 'rawLotId');
        return `${row.shift} · ${readableDate(row.collectionDate)} · ${row.quantityLiters} L · ${id}`;
      }))]
      : rawIds.map((id, index) => {
        const row = byId(id, 'rawLotId');
        return {id, position: point(1, index), data: {label: `${row.shift} collection\n${readableDate(row.collectionDate)}\n${row.quantityLiters} L · ${id}`}, className: 'source'};
      })),
    ...(isCollapsed(batches)
      ? [aggregateNode('batch', batches.length, 2, 'processing batches', batches)]
      : batches.map((id, index) => ({id, position: point(2, index), data: {label: `Mixed processing batch\n${id}\nMilk from multiple farms`}, className: 'process'}))),
    ...(isCollapsed(finishedLots)
      ? [aggregateNode('finished', finishedLots.length, 3, 'finished milk lots', finishedLots.map((id) => {
        const row = byId(id, 'finishedLotId');
        return `${row.lotCode} · ${id}`;
      }))]
      : finishedLots.map((id, index) => {
        const row = byId(id, 'finishedLotId');
        return {id, position: point(3, index), data: {label: `Finished dairy lot\n${row.lotCode}\n${id}`}, className: 'impact'};
      })),
    ...(isCollapsed(stores)
      ? [aggregateNode('store', stores.length, 4, 'retail destinations', stores.map((id) => {
        const row = byId(id, 'storeId');
        return `${row.storeName} · ${id}`;
      }))]
      : stores.map((id, index) => {
        const row = byId(id, 'storeId');
        return {id, position: point(4, index), data: {label: `Retail destination\n${row.storeName}\nArrived ${readableDate(row.storeArrivalDate ?? undefined)}\n${id}`}, className: 'destination'};
      }))
  ];

  const edges: Edge[] = rows.flatMap((row) => [
    {
      id: `farm-${visibleId('farm', row.farmId, farmIds)}-${visibleId('raw', row.rawLotId, rawIds)}`,
      source: visibleId('farm', row.farmId, farmIds),
      target: visibleId('raw', row.rawLotId, rawIds),
      label: 'produced'
    },
    {
      id: `raw-${visibleId('raw', row.rawLotId, rawIds)}-${visibleId('batch', row.batchId, batches)}`,
      source: visibleId('raw', row.rawLotId, rawIds),
      target: visibleId('batch', row.batchId, batches),
      label: 'mixed into'
    },
    {
      id: `finished-${visibleId('batch', row.batchId, batches)}-${visibleId('finished', row.finishedLotId, finishedLots)}`,
      source: visibleId('batch', row.batchId, batches),
      target: visibleId('finished', row.finishedLotId, finishedLots),
      label: 'packaged as'
    },
    ...(row.storeId ? [{
      id: `store-${visibleId('finished', row.finishedLotId, finishedLots)}-${visibleId('store', row.storeId, stores)}`,
      source: visibleId('finished', row.finishedLotId, finishedLots),
      target: visibleId('store', row.storeId, stores),
      label: 'shipped to'
    }] : [])
  ]).map((edge) => ({...edge, animated: true, markerEnd: arrow}));

  return {
    kind,
    title,
    explanation,
    facts: [
      `${rawIds.length} time-stamped raw collection${rawIds.length === 1 ? '' : 's'} from ${farmIds.length} farm${farmIds.length === 1 ? '' : 's'}.`,
      `${batches.length} mixed processing batch${batches.length === 1 ? '' : 'es'} create${batches.length === 1 ? 's' : ''} the shared-exposure link.`,
      `${finishedLots.length} finished lot${finishedLots.length === 1 ? '' : 's'} and ${stores.length} retail destination${stores.length === 1 ? '' : 's'} are in the evidence path.`
    ],
    nodes: dedupeNodes(nodes),
    edges: dedupeEdges(edges)
  };
}

export const buildForwardTrace = (source: string, rows: TraceRow[]) => buildNetworkTrace(
  'downstream-impact',
  'Where could this collection have reached?',
  `Forward trace from ${source}. These are candidate destinations for quality review, not an automatic recall decision.`,
  rows
);

export const buildReverseTrace = (finishedLotId: string, rows: TraceRow[]) => buildNetworkTrace(
  'farmer-source',
  'Which farms could this milk have come from?',
  `Reverse trace from finished lot ${finishedLotId}. Every source collection is retained as time-stamped evidence.`,
  rows
);

export const buildBatchTrace = (batchId: string, rows: TraceRow[]) => buildNetworkTrace(
  'in-process',
  'Which farms and stores connect through this batch?',
  `Batch ${batchId} mixes source collections before splitting into finished lots and store deliveries.`,
  rows
);
