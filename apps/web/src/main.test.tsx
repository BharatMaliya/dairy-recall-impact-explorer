import {waitFor} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';

vi.mock('./app/app', () => ({App: () => <div>Application booted</div>}));

describe('browser bootstrap', () => {
  it('mounts the application at the root element', async () => {
    document.body.innerHTML = '<div id="root"></div>';
    await import('./main');

    await waitFor(() => expect(document.getElementById('root')?.textContent).toBe('Application booted'));
  });
});
