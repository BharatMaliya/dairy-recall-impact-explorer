import {describe, expect, it, vi} from 'vitest';
import {startServer} from './server.js';

describe('server startup', () => {
  it('listens on the requested all-interface port', async () => {
    const app = {close: vi.fn(), listen: vi.fn().mockResolvedValue(undefined), log: {error: vi.fn()}};

    await expect(startServer(app, null, 4100)).resolves.toBe(app);
    expect(app.listen).toHaveBeenCalledWith({port: 4100, host: '0.0.0.0'});
  });

  it('closes the graph driver when listening fails', async () => {
    const failure = new Error('address already in use');
    const app = {close: vi.fn(), listen: vi.fn().mockRejectedValue(failure), log: {error: vi.fn()}};
    const driver = {close: vi.fn().mockResolvedValue(undefined)};

    await expect(startServer(app, driver, 4100)).rejects.toThrow(failure);
    expect(app.log.error).toHaveBeenCalledWith(failure);
    expect(driver.close).toHaveBeenCalledOnce();
  });
});
