import { FormEvent, useMemo, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Background, Controls, MarkerType, ReactFlow, type Edge, type Node } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import './styles.css';

const api = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001';
const get = async <T,>(path: string): Promise<T> => {
  const response = await fetch(`${api}${path}`);
  if (!response.ok) throw new Error('No matching trace was found.');
  return response.json();
};

type Entity = {id: string; labels: string[]; display: string};
type Forward = {sourceId: string; sourceName: string; collectionDate: string; shift: string; quantityLiters: number; batchId: string; finishedLotId: string; lotCode: string; shipments: string[]; destinations: string[]};
type Reverse = {finishedLotId: string; batchId: string; rawLotId: string; rawName: string; collectionDate: string; quantityLiters: number; farmId: string; farmName: string};
type FarmLot = {id: string; collectionDate: string; quantityLiters: number};
type BatchTrace = {batchId: string; rawLotId: string; rawName: string; collectionDate: string; shift: string; quantityLiters: number; farmId: string; farmName: string; finishedLotId: string; lotCode: string; shipmentId: string; storeId: string; storeName: string};
type TraceKind = 'farmer-source' | 'downstream-impact' | 'in-process';
type Trace = {kind: TraceKind; title: string; explanation: string; nodes: Node[]; edges: Edge[]; facts: string[]};
const uniqueNodes = (nodes: Node[]) => [...new Map(nodes.map((node) => [node.id, node])).values()];

const initialTrace: Trace = {
  kind: 'farmer-source', title: 'Enter a lot, farm, batch, or printed code', explanation: 'We will show the evidence path, not just a list of IDs.', facts: ['Try RML-2026-08-041-A', 'Try FL-2PCT-2026-08-117-B', 'Try FARM-014'], nodes: [], edges: []
};

const buildForwardTrace = (source: string, rows: Forward[]): Trace => ({
  kind: 'downstream-impact', title: 'Where could this farmer’s milk have reached?', explanation: `Forward trace from ${source}. Every result is candidate evidence for quality review.`,
  facts: rows.flatMap((row) => [`${row.lotCode} was produced in ${row.batchId}`, row.destinations.filter(Boolean).join(' · ') || 'Shipment has no confirmed destination yet']),
  nodes: [{id: source, position: {x: 30, y: 150}, data: {label: `${rows[0]?.sourceName || 'Raw milk lot'}\n${rows[0]?.collectionDate || ''} · ${rows[0]?.shift || ''}\n${rows[0]?.quantityLiters || ''} L\n${source}`}, className: 'source'}, ...rows.flatMap((row, index) => [{id: row.batchId, position: {x: 305, y: 70 + index * 120}, data: {label: `Processing batch\n${row.batchId}`}, className: 'process'}, {id: row.finishedLotId, position: {x: 570, y: 70 + index * 120}, data: {label: `${row.lotCode}\nFinished dairy lot`}, className: 'impact'}, {id: `destination-${index}`, position: {x: 835, y: 70 + index * 120}, data: {label: `${row.destinations.filter(Boolean).join('\n') || 'In transit'}\nStore destination`}, className: 'destination'}])],
  edges: rows.flatMap((row, index) => [{id: `consume-${index}`, source, target: row.batchId, label: 'consumed in'}, {id: `package-${index}`, source: row.finishedLotId, target: row.batchId, label: 'packaged in'}, {id: `ship-${index}`, source: row.finishedLotId, target: `destination-${index}`, label: 'shipped to'}]).map((edge) => ({...edge, animated: true, markerEnd: {type: MarkerType.ArrowClosed}}))
});

const buildReverseTrace = (lot: string, rows: Reverse[]): Trace => ({
  kind: 'farmer-source', title: 'Which farmers could this milk have come from?', explanation: `Reverse trace from ${lot}. The graph shows the raw-lot and process evidence for every source.`,
  facts: rows.map((row) => `${row.farmName} (${row.farmId}) → ${row.rawLotId} → ${row.batchId}`),
  nodes: [{id: lot, position: {x: 760, y: 150}, data: {label: `Reported finished lot\n${lot}`}, className: 'impact'}, ...rows.flatMap((row, index) => [{id: row.farmId, position: {x: 25, y: 65 + index * 130}, data: {label: `${row.farmName}\n${row.farmId}`}, className: 'source'}, {id: row.rawLotId, position: {x: 275, y: 65 + index * 130}, data: {label: `${row.rawName}\n${row.collectionDate}\n${row.quantityLiters} L`}, className: 'source'}, {id: row.batchId, position: {x: 525, y: 65 + index * 130}, data: {label: `Processing batch\n${row.batchId}`}, className: 'process'}])],
  edges: rows.flatMap((row, index) => [{id: `farm-${index}`, source: row.farmId, target: row.rawLotId, label: 'produced'}, {id: `batch-${index}`, source: row.rawLotId, target: row.batchId, label: 'consumed in'}, {id: `lot-${index}`, source: lot, target: row.batchId, label: 'packaged in'}]).map((edge) => ({...edge, animated: true, markerEnd: {type: MarkerType.ArrowClosed}}))
});

const buildBatchTrace = (batch: string, rows: BatchTrace[]): Trace => ({
  kind: 'in-process', title: 'Which farms and stores connect through this batch?', explanation: `Batch ${batch} joins multiple source lots before the finished product moves downstream.`,
  facts: rows.map((row) => `${row.farmName} → ${row.rawLotId} → ${row.lotCode} → ${row.storeName || 'shipment in progress'}`),
  nodes: uniqueNodes([{id: batch, position: {x: 475, y: 155}, data: {label: batch}, className: 'process'}, ...rows.flatMap((row, index) => [{id: row.farmId, position: {x: 20, y: 30 + index * 62}, data: {label: row.farmName}, className: 'source'}, {id: row.rawLotId, position: {x: 240, y: 30 + index * 62}, data: {label: row.rawLotId}, className: 'source'}, {id: row.finishedLotId, position: {x: 710, y: 100}, data: {label: row.lotCode}, className: 'impact'}, {id: row.storeId || 'pending-store', position: {x: 930, y: 100}, data: {label: row.storeName || 'In transit'}, className: 'destination'}])]),
  edges: rows.flatMap((row, index) => [{id: `source-${index}`, source: row.farmId, target: row.rawLotId, label: 'produced'}, {id: `input-${index}`, source: row.rawLotId, target: batch, label: 'input'}, {id: `output-${index}`, source: row.finishedLotId, target: batch, label: 'output'}, {id: `store-${index}`, source: row.finishedLotId, target: row.storeId || 'pending-store', label: 'delivered'}]).map((edge) => ({...edge, animated: true, markerEnd: {type: MarkerType.ArrowClosed}}))
});

function Explorer() {
  const [term, setTerm] = useState('');
  const [trace, setTrace] = useState<Trace>(initialTrace);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const graphNodes = useMemo(() => trace.nodes, [trace]);

  const explore = async (value: string) => {
    setTerm(value); setLoading(true); setError('');
    try {
      const matches = await get<Entity[]>(`/api/entities/search?q=${encodeURIComponent(value)}`);
      const entity = matches[0];
      if (!entity) throw new Error('No matching lot, farm, batch, or printed code was found.');
      if (entity.labels.includes('FinishedLot')) setTrace(buildReverseTrace(entity.id, await get<Reverse[]>(`/api/traces/reverse/${entity.id}`)));
      else if (entity.labels.includes('Farm')) {
        const lots = await get<FarmLot[]>(`/api/farms/${entity.id}/raw-lots`);
        if (!lots[0]) throw new Error('No collection lots were found for that farm.');
        setTrace(buildForwardTrace(lots[0].id, await get<Forward[]>(`/api/traces/forward/${lots[0].id}`)));
      } else if (entity.labels.includes('RawMilkLot')) setTrace(buildForwardTrace(entity.id, await get<Forward[]>(`/api/traces/forward/${entity.id}`)));
      else if (entity.labels.includes('ProcessingBatch')) setTrace(buildBatchTrace(entity.id, await get<BatchTrace[]>(`/api/traces/batch/${entity.id}`)));
      else throw new Error('That entity is found, but its trace view is not available yet. Try a farm or milk lot.');
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Unable to run this trace.'); }
    finally { setLoading(false); }
  };
  const submit = (event: FormEvent) => { event.preventDefault(); if (term.trim()) void explore(term.trim()); };

  return <main className="explorer"><header><div className="wordmark"><span>●</span> dairytrace</div><p>Milk lineage explorer · CognoDB</p></header><section className="intro"><p className="eyebrow">EXPLAINABLE RECALL INVESTIGATION</p><h1>Trace the milk.<br/><em>Understand the impact.</em></h1><p>Start from any printed lot, raw collection lot, or farm. The result shows how the evidence connects—upstream, downstream, and while milk is still moving through the chain.</p></section><form onSubmit={submit} className="search"><input value={term} onChange={(event) => setTerm(event.target.value)} placeholder="Search a lot, farm, or batch number…" aria-label="Search a lot, farm, or batch number"/><button disabled={loading}>{loading ? 'Tracing…' : 'Trace supply chain'}</button></form><div className="examples"><span>INTERVIEWER TEST CASES</span>{['RML-2026-08-041-A', 'FL-2PCT-2026-08-117-B', 'FARM-014'].map((sample) => <button key={sample} onClick={() => void explore(sample)}>{sample}</button>)}</div>{error && <div className="error">{error}</div>}<section className="trace"><div className="trace-head"><div><p className="eyebrow">{trace.kind.replace('-', ' ').toUpperCase()}</p><h2>{trace.title}</h2><p>{trace.explanation}</p></div><div className="legend"><span className="farm"/> Farm / raw lot <span className="batch"/> Process <span className="lot"/> Finished lot</div></div><div className="flow"><ReactFlow nodes={graphNodes} edges={trace.edges} fitView nodesDraggable={false} nodesConnectable={false} proOptions={{hideAttribution: true}}><Background color="#cbd4d0" gap={22}/><Controls showInteractive={false}/></ReactFlow>{!trace.nodes.length && <div className="empty-flow">Your animated evidence path will appear here.</div>}</div><aside><p className="eyebrow">WHAT THIS MEANS</p>{trace.facts.map((fact) => <p key={fact}>{fact}</p>)}</aside></section><footer>Candidate impact only. A human quality manager makes the recall decision.</footer></main>;
}

ReactDOM.createRoot(document.getElementById('root')!).render(<QueryClientProvider client={new QueryClient()}><Explorer/></QueryClientProvider>);
