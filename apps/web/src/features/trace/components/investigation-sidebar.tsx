import type { FormEvent } from 'react';
import type { Trace, TraceSample } from '../model/types';

type InvestigationSidebarProps = {
  date: string;
  error: string;
  isLoading: boolean;
  isOpen: boolean;
  onDateChange: (date: string) => void;
  onSubmit: (event: FormEvent) => void;
  onTermChange: (term: string) => void;
  onToggle: () => void;
  onTrace: (id: string, date: string) => void;
  samples: TraceSample[];
  term: string;
  trace: Trace;
};

export function InvestigationSidebar({
  date,
  error,
  isLoading,
  isOpen,
  onDateChange,
  onSubmit,
  onTermChange,
  onToggle,
  onTrace,
  samples,
  term,
  trace
}: InvestigationSidebarProps) {
  return <aside className={`control-sidebar ${isOpen ? 'is-open' : 'is-collapsed'}`}>
    <button
      className="sidebar-toggle"
      type="button"
      onClick={onToggle}
      aria-label={isOpen ? 'Collapse investigation controls' : 'Open investigation controls'}
    >
      {isOpen ? '‹' : '›'}
    </button>
    <div className="sidebar-content">
      <header>
        <div className="wordmark"><span>●</span> dairytrace</div>
        <p>CognoDB evidence explorer</p>
      </header>
      <p className="eyebrow">RECALL INVESTIGATION</p>
      <h1>Trace the milk.</h1>
      <p className="sidebar-intro">For a farm, the date is when milk was collected. For a store, it is when milk was delivered.</p>
      <form onSubmit={onSubmit} className="sidebar-search">
        <label>Search</label>
        <input
          value={term}
          onChange={(event) => onTermChange(event.target.value)}
          placeholder="Farm, store, lot, or batch…"
          aria-label="Farm, store, lot, or batch number"
        />
        <label>Farm collection / store delivery date</label>
        <input
          type="date"
          min="2026-08-01"
          max="2026-08-19"
          value={date}
          onChange={(event) => onDateChange(event.target.value)}
          aria-label="Farm collection or store delivery date"
        />
        <button disabled={isLoading}>{isLoading ? 'Tracing…' : 'Trace supply chain'}</button>
      </form>
      <div className="examples">
        <span>TRY A LIVE CASE</span>
        {samples.map((sample) => <button type="button" key={sample.id} onClick={() => onTrace(sample.id, sample.date)}>
          {sample.label}
        </button>)}
      </div>
      {error && <div className="error">{error}</div>}
      <section className="trace-summary">
        <p className="eyebrow">{trace.kind.replace('-', ' ').toUpperCase()}</p>
        <h2>{trace.title}</h2>
        <p>{trace.explanation}</p>
        <div className="facts">{trace.facts.map((fact) => <p key={fact}>{fact}</p>)}</div>
      </section>
    </div>
  </aside>;
}
