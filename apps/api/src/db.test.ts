import type {Driver} from 'neo4j-driver';
import {describe, expect, it, vi} from 'vitest';
import {executeRead, executeWrite} from './db.js';

function fakeDriver(records: Array<{toObject: () => unknown}>) {
  const session = {
    close: vi.fn().mockResolvedValue(undefined),
    executeRead: vi.fn().mockImplementation(async (work) => work({run: vi.fn().mockResolvedValue({records})})),
    executeWrite: vi.fn().mockImplementation(async (work) => work({run: vi.fn().mockResolvedValue({records})}))
  };
  return {driver: {session: vi.fn().mockReturnValue(session)} as unknown as Driver, session};
}

describe('CognoDB database adapter', () => {
  it('executes and maps a read query while always closing the session', async () => {
    const {driver, session} = fakeDriver([{toObject: () => ({id: 'FARM-014'})}]);

    await expect(executeRead(driver, 'MATCH (n) WHERE n.id = $id RETURN n', {id: 'FARM-014'})).resolves.toEqual([{id: 'FARM-014'}]);
    expect(session.executeRead).toHaveBeenCalledOnce();
    expect(session.close).toHaveBeenCalledOnce();
  });

  it('executes a write query and rejects missing CognoDB configuration safely', async () => {
    const {driver, session} = fakeDriver([{toObject: () => ({deleted: 1})}]);

    await expect(executeWrite(driver, 'MATCH (n) DELETE n')).resolves.toEqual([{deleted: 1}]);
    expect(session.executeWrite).toHaveBeenCalledOnce();
    await expect(executeRead(null, 'MATCH (n) RETURN n')).rejects.toThrow('CognoDB is not configured');
    await expect(executeWrite(null, 'MATCH (n) DELETE n')).rejects.toThrow('CognoDB is not configured');
  });
});
