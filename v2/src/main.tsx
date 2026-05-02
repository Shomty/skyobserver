import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

import {ThemeProvider} from './context/ThemeContext.tsx';
import {BrowserRouter} from 'react-router-dom';
import {ErrorBoundary} from './components/ErrorBoundary.tsx';
import {debugLog, installDebugConsole, isDebugEnabled} from './lib/debug.ts';

// Suppress benign Vite HMR noise only in development.
if (typeof window !== 'undefined') {
  installDebugConsole();
  debugLog('bootstrap', 'Initializing client runtime', {debugEnabled: isDebugEnabled()});
}

if (typeof window !== 'undefined' && import.meta.env.DEV) {
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason && (
      event.reason.message?.includes('WebSocket') || 
      event.reason.message?.includes('vite') ||
      String(event.reason).includes('WebSocket') ||
      String(event.reason).includes('closed without opened') ||
      String(event.reason).includes('connection failed')
    )) {
      event.preventDefault();
      event.stopPropagation();
    }
  });

  window.addEventListener('error', (event) => {
    if (event.message && (
      event.message.includes('WebSocket') || 
      event.message.includes('vite') ||
      event.message.includes('closed without opened')
    )) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true);

  // Silence the specific Vite websocket reconnect noise in dev only.
  const originalError = console.error;
  console.error = (...args) => {
    if (args[0] && typeof args[0] === 'string' && 
        (args[0].includes('[vite] failed to connect to websocket') || 
         args[0].includes('WebSocket closed without opened'))) {
      return;
    }
    originalError.apply(console, args);
  };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>,
);
