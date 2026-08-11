import { Background, Controls, ReactFlow, type NodeTypes } from '@xyflow/react';
import { AggregateNode } from './aggregate-node';
import type { Trace } from '../model/types';

const nodeTypes: NodeTypes = {aggregate: AggregateNode};

type TraceCanvasProps = {
  trace: Trace;
  isLoading: boolean;
};

export function TraceCanvas({trace, isLoading}: TraceCanvasProps) {
  return <div className="graph-canvas">
    <ReactFlow
      nodes={trace.nodes}
      edges={trace.edges}
      nodeTypes={nodeTypes}
      fitView
      fitViewOptions={{padding: 0.18}}
      nodesDraggable={false}
      nodesConnectable={false}
      proOptions={{hideAttribution: true}}
    >
      <Background color="#cbd4d0" gap={22}/>
      <Controls showInteractive={false}/>
    </ReactFlow>
    {isLoading && <div className="flow-loading" role="status" aria-live="polite">
      <span className="loading-spinner"/>
      <div>
        <strong>Tracing supply-chain evidence</strong>
        <small>Following collection, processing, and delivery links…</small>
      </div>
    </div>}
    {!isLoading && !trace.nodes.length && <div className="empty-flow">
      Search a farm, store, lot, or batch to draw its evidence path.
    </div>}
  </div>;
}
