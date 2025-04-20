import '@/index.css';
import { ApiContextProvider } from '@/providers/api-context-provider.tsx';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { Toaster } from '@/components/ui/sonner.tsx';

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ApiContextProvider>
        <App />
        <Toaster />
      </ApiContextProvider>
    </QueryClientProvider>
  </StrictMode>,
);
