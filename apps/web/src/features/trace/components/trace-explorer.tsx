import type {FormEvent} from 'react';
import {useState} from 'react';
import {traceSamples} from '../model/constants';
import {useTraceInvestigation} from '../hooks/use-trace-investigation';
import {InvestigationSidebar} from './investigation-sidebar';
import {TraceCanvas} from './trace-canvas';

export function TraceExplorer() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const {date, error, explore, isLoading, setDate, setTerm, term, trace} = useTraceInvestigation();

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (term.trim()) void explore(term.trim());
  };

  return <main className="investigation-workspace">
    <TraceCanvas trace={trace} isLoading={isLoading}/>
    <InvestigationSidebar
      date={date}
      error={error}
      isLoading={isLoading}
      isOpen={isSidebarOpen}
      onDateChange={setDate}
      onSubmit={submit}
      onTermChange={setTerm}
      onToggle={() => setIsSidebarOpen((open) => !open)}
      onTrace={(id, traceDate) => void explore(id, traceDate)}
      samples={traceSamples}
      term={term}
      trace={trace}
    />
    <div className="flow-legend"><span className="farm"/> Farm / raw lot <span className="batch"/> Process <span className="lot"/> Finished lot</div>
  </main>;
}
