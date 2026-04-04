import '@/lib/env'; // validate env vars before anything else
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from '@/App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
