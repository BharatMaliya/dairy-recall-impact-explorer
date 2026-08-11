import { useState } from 'react';
import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import type { AggregateNodeData } from '../model/types';

export function AggregateNode({data}: NodeProps<Node<AggregateNodeData, 'aggregate'>>) {
  const [isListVisible, setIsListVisible] = useState(false);
  const [query, setQuery] = useState('');
  const matchingItems = data.items.filter((item) => item.toLowerCase().includes(query.trim().toLowerCase()));

  return <div className="aggregate-node">
    <Handle className="aggregate-handle" type="target" position={Position.Left}/>
    <span>GROUPED EVIDENCE</span>
    <strong>{data.title}</strong>
    <small>{data.detail}</small>
    <button className="nodrag nopan" type="button" onClick={(event) => {
      event.stopPropagation();
      setIsListVisible((visible) => !visible);
    }}>
      {isListVisible ? 'Hide list' : `View all ${data.items.length}`}
    </button>
    {isListVisible && <>
      <input
        className="aggregate-search nodrag nopan nowheel"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onPointerDown={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
        placeholder="Search this list…"
        aria-label={`Search ${data.title}`}
      />
      <div
        className="aggregate-list nowheel nodrag nopan"
        onWheel={(event) => event.stopPropagation()}
        onPointerDown={(event) => event.stopPropagation()}
      >
        {matchingItems.length
          ? matchingItems.map((item) => <span key={item}>{item}</span>)
          : <em>No matching evidence.</em>}
      </div>
    </>}
    <Handle className="aggregate-handle" type="source" position={Position.Right}/>
  </div>;
}
