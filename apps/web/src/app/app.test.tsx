import {render, screen} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';

vi.mock('../features/trace/components/trace-explorer', () => ({
  TraceExplorer: () => <div>Trace feature mounted</div>
}));

import {App} from './app';

describe('App composition', () => {
  it('mounts the trace feature inside the application provider tree', () => {
    render(<App/>);
    expect(screen.getByText('Trace feature mounted')).toBeTruthy();
  });
});
