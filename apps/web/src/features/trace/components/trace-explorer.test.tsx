import {render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {describe, expect, it, vi} from 'vitest';

vi.mock('@xyflow/react', () => ({
  Background: () => <div data-testid="background"/>,
  Controls: () => <div data-testid="controls"/>,
  Handle: () => <span/>,
  MarkerType: {ArrowClosed: 'arrow'},
  Position: {Left: 'left', Right: 'right'},
  ReactFlow: ({children, nodes}: {children: React.ReactNode; nodes: Array<{id: string}>}) => <div data-testid="flow">{nodes.map((node) => <span key={node.id}>{node.id}</span>)}{children}</div>
}));

vi.mock('../api/trace-api', () => ({
  traceApi: {
    searchEntities: vi.fn().mockResolvedValue([{id: 'FARM-014', labels: ['Farm'], display: 'Dairy Farm 014'}]),
    farm: vi.fn().mockResolvedValue([{
      batchId: 'PB-001', rawLotId: 'RML-001', rawName: 'Morning collection', collectionDate: '2026-08-10', shift: 'AM', quantityLiters: 280,
      farmId: 'FARM-014', farmName: 'Dairy Farm 014', finishedLotId: 'FL-001', lotCode: 'FRESH-0001', shipmentId: 'SHP-001', storeId: 'STORE-001', storeName: 'Retail store', storeArrivalDate: '2026-08-12'
    }]),
    store: vi.fn(), forward: vi.fn(), reverse: vi.fn(), batch: vi.fn()
  }
}));

import {TraceExplorer} from './trace-explorer';

describe('TraceExplorer', () => {
  it('runs a farmer trace from the sidebar and renders the returned graph path', async () => {
    const user = userEvent.setup();
    render(<TraceExplorer/>);

    await user.type(screen.getByRole('textbox', {name: 'Farm, store, lot, or batch number'}), 'FARM-014');
    await user.click(screen.getByRole('button', {name: 'Trace supply chain'}));

    await waitFor(() => expect(screen.getByText("Where did Dairy Farm 014's milk reach?")).toBeTruthy());
    expect(screen.getByTestId('flow').textContent).toContain('FARM-014');
    expect(screen.getByTestId('flow').textContent).toContain('STORE-001');
  });
});
