const requiredEnvVars = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'] as const;

function validateEnv() {
  const missing: string[] = [];
  for (const key of requiredEnvVars) {
    if (!import.meta.env[key]) {
      missing.push(key);
    }
  }
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missing.map((k) => `  - ${k}`).join('\n')}\n\nCopy apps/web/.env.example to apps/web/.env.local and fill in the values.`,
    );
  }
}

validateEnv();

export const env = {
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL as string,
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
};
