import {render, screen, waitFor} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';

vi.mock('../features/trace/components/trace-explorer', () => ({
  TraceExplorer: () => <div>Trace feature mounted</div>
}));

const {wake} = vi.hoisted(() => ({
  wake: vi.fn().mockResolvedValue(undefined)
}));

vi.mock('../features/trace/api/trace-api', () => ({
  traceApi: {wake}
}));

import {App} from './app';

describe('App composition', () => {
  it('mounts the trace feature and warms the API in the background', async () => {
    render(<App/>);
    expect(screen.getByText('Trace feature mounted')).toBeTruthy();
    await waitFor(() => expect(wake).toHaveBeenCalledOnce());
  });
});
