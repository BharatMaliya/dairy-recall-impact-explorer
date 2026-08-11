import { useCallback, useEffect, useState } from 'react';
import { traceApi } from '../api/trace-api';
import { defaultTraceDate, initialTrace, loadingTrace } from '../model/constants';
import { readableDate } from '../model/format';
import { buildBatchTrace, buildForwardTrace, buildNetworkTrace, buildReverseTrace } from '../model/trace-graph';
import type { Trace } from '../model/types';

export function useTraceInvestigation() {
  const [term, setTerm] = useState('');
  const [date, setDate] = useState(defaultTraceDate);
  const [trace, setTrace] = useState<Trace>(initialTrace);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const explore = useCallback(async (value: string, selectedDate = date) => {
    setTerm(value);
    setDate(selectedDate);
    setTrace(loadingTrace);
    setIsLoading(true);
    setError('');

    try {
      const entity = (await traceApi.searchEntities(value))[0];
      if (!entity) throw new Error('No matching farm, store, lot, or batch was found.');

      if (entity.labels.includes('Farm')) {
        const rows = await traceApi.farm(entity.id, selectedDate);
        setTrace(buildNetworkTrace(
          'downstream-impact',
          `Where did ${entity.display}'s milk reach?`,
          `Forward trace for the collections recorded on ${readableDate(selectedDate)}.`,
          rows
        ));
      } else if (entity.labels.includes('Store')) {
        const rows = await traceApi.store(entity.id, selectedDate);
        setTrace(buildNetworkTrace(
          'farmer-source',
          `Which farms could have supplied ${entity.display}?`,
          `Reverse trace for milk delivered to this store on ${readableDate(selectedDate)}.`,
          rows
        ));
      } else if (entity.labels.includes('FinishedLot')) {
        setTrace(buildReverseTrace(entity.id, await traceApi.reverse(entity.id)));
      } else if (entity.labels.includes('RawMilkLot')) {
        setTrace(buildForwardTrace(entity.id, await traceApi.forward(entity.id)));
      } else if (entity.labels.includes('ProcessingBatch')) {
        setTrace(buildBatchTrace(entity.id, await traceApi.batch(entity.id)));
      } else {
        throw new Error('That entity exists, but does not have a trace view yet.');
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to run this trace.');
    } finally {
      setIsLoading(false);
    }
  }, [date]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedTrace = params.get('trace');
    if (sharedTrace) void explore(sharedTrace, params.get('date') ?? defaultTraceDate);
  }, []);

  return {date, error, explore, isLoading, setDate, setTerm, term, trace};
}
