import {describe, expect, it} from 'vitest';
import {defaultTraceDate, initialTrace, traceSamples} from './constants';
import {readableDate} from './format';

describe('trace display model', () => {
  it('formats stored ISO dates consistently and handles missing values', () => {
    expect(readableDate('2026-08-10')).toBe('10 Aug 2026');
    expect(readableDate()).toBe('Date not recorded');
  });

  it('provides a valid initial trace and reproducible live samples', () => {
    expect(defaultTraceDate).toBe('2026-08-10');
    expect(initialTrace.nodes).toEqual([]);
    expect(traceSamples.map((sample) => sample.id)).toContain('STORE-002');
  });
});
