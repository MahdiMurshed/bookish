import { defineConfig } from 'vitest/config';

// Stub VITE_* env vars so the singleton supabase client doesn't throw at
// module load time. Tests that actually exercise DB-touching code mock the
// whole ../supabaseClient module anyway; this just lets unrelated tests
// import modules that transitively touch supabaseClient.
export default defineConfig({
  define: {
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify('http://localhost:54321'),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify('test-anon-key'),
  },
});
