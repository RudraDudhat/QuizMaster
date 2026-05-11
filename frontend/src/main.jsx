import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import './index.css'
import AppRouter from './routes/AppRouter'
import SmoothScroll from './components/ui/SmoothScroll'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Short default so newly created quizzes / updated state surface to
      // students quickly. Pages that genuinely benefit from longer caching
      // (categories, tags, settings) override this per-query.
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <SmoothScroll>
          <AppRouter />
          <Toaster position="top-right" />
        </SmoothScroll>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
