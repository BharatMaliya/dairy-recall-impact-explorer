import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {useEffect} from 'react';
import {traceApi} from '../features/trace/api/trace-api';
import { TraceExplorer } from '../features/trace/components/trace-explorer';
import '@xyflow/react/dist/style.css';
import '../styles.css';
import '../layout-overrides.css';
import '../theme.css';

const queryClient = new QueryClient();

export function App() {
  useEffect(() => {
    // Start a serverless API and validate its CognoDB connection while the user sees the UI.
    void traceApi.wake().catch(() => undefined);
  }, []);

  return <QueryClientProvider client={queryClient}>
    <TraceExplorer/>
  </QueryClientProvider>;
}
