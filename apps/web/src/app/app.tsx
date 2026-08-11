import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TraceExplorer } from '../features/trace/components/trace-explorer';
import '@xyflow/react/dist/style.css';
import '../styles.css';
import '../layout-overrides.css';

const queryClient = new QueryClient();

export function App() {
  return <QueryClientProvider client={queryClient}>
    <TraceExplorer/>
  </QueryClientProvider>;
}
