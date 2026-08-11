import {render, screen} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';
import {initialTrace, loadingTrace} from '../model/constants';

vi.mock('@xyflow/react', () => ({
  Background: () => <div data-testid="background"/>,
  Controls: () => <div data-testid="controls"/>,
  ReactFlow: ({children}: {children: React.ReactNode}) => <div data-testid="react-flow">{children}</div>
}));

import {TraceCanvas} from './trace-canvas';

describe('TraceCanvas', () => {
  it('shows an empty investigation prompt until evidence exists', () => {
    render(<TraceCanvas trace={initialTrace} isLoading={false}/>);
    expect(screen.getByText('Search a farm, store, lot, or batch to draw its evidence path.')).toBeTruthy();
  });

  it('replaces graph content with an accessible loading status while tracing', () => {
    render(<TraceCanvas trace={loadingTrace} isLoading/>);
    expect(screen.getByRole('status').textContent).toContain('Tracing supply-chain evidence');
  });
});
