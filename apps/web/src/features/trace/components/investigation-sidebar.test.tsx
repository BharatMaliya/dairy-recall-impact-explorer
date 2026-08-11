import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {describe, expect, it, vi} from 'vitest';
import {initialTrace, traceSamples} from '../model/constants';
import {InvestigationSidebar} from './investigation-sidebar';

describe('InvestigationSidebar', () => {
  it('submits user search and triggers a sample investigation', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());
    const onTrace = vi.fn();

    render(<InvestigationSidebar
      date="2026-08-10"
      error=""
      isLoading={false}
      isOpen
      onDateChange={vi.fn()}
      onSubmit={onSubmit}
      onTermChange={vi.fn()}
      onToggle={vi.fn()}
      onTrace={onTrace}
      samples={traceSamples}
      term="FARM-014"
      trace={initialTrace}
    />);

    await user.click(screen.getByRole('button', {name: 'Trace supply chain'}));
    expect(onSubmit).toHaveBeenCalledOnce();

    await user.click(screen.getByRole('button', {name: 'STORE-002 · delivered 10 Aug'}));
    expect(onTrace).toHaveBeenCalledWith('STORE-002', '2026-08-10');
  });
});
