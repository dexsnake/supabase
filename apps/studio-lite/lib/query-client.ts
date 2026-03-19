import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: false,
      refetchOnWindowFocus: false,
      throwOnError: false,
      networkMode: 'always',
    },
    mutations: {
      networkMode: 'always',
    },
  },
})
