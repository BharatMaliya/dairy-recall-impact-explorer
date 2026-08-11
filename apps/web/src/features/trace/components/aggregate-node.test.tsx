import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {vi, describe, expect, it} from 'vitest';

vi.mock('@xyflow/react', () => ({
  Handle: ({type}: {type: string}) => <span data-testid={`handle-${type}`}/>,
  Position: {Left: 'left', Right: 'right'}
}));

import {AggregateNode} from './aggregate-node';

describe('AggregateNode', () => {
  it('reveals, filters, and hides grouped evidence without adding items to the canvas', async () => {
    const user = userEvent.setup();
    render(<AggregateNode id="aggregate-farm" type="aggregate" selected={false} zIndex={0} draggable={false} selectable={false} deletable={false} isConnectable data={{
      title: '3 milk producers',
      detail: 'This category is collapsed above 20 nodes.',
      items: ['Dairy Farm 001 · FARM-001', 'Dairy Farm 002 · FARM-002', 'Dairy Farm 003 · FARM-003']
    }} positionAbsoluteX={0} positionAbsoluteY={0} dragging={false}/>);

    await user.click(screen.getByRole('button', {name: 'View all 3'}));
    expect(screen.getByText('Dairy Farm 002 · FARM-002')).toBeTruthy();

    await user.type(screen.getByRole('textbox', {name: 'Search 3 milk producers'}), '003');
    expect(screen.queryByText('Dairy Farm 001 · FARM-001')).toBeNull();
    expect(screen.getByText('Dairy Farm 003 · FARM-003')).toBeTruthy();

    await user.click(screen.getByRole('button', {name: 'Hide list'}));
    expect(screen.queryByRole('textbox', {name: 'Search 3 milk producers'})).toBeNull();
  });
});
