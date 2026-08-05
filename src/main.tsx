import {StrictMode, Suspense} from 'react';
import {createRoot} from 'react-dom/client';
import './index.css';

import {ThemeProvider} from './context/ThemeContext.tsx';
import {BrowserRouter, Routes, Route, useLocation} from 'react-router-dom';
import {ErrorBoundary} from './components/ErrorBoundary.tsx';
import {AnalyticsPageView} from './components/AnalyticsPageView.tsx';
import {HomeRoute} from './routes/HomeRoute.tsx';
import {lazyWithReload} from './lib/lazyWithReload.ts';
import {debugLog, installDebugConsole, isDebugEnabled} from './lib/debug.ts';

const App = lazyWithReload(() => import('./App.tsx'));

const SharedChatPage = lazyWithReload(() => import('./pages/SharedChatPage.tsx'));
const GiftChooserPage = lazyWithReload(
  () => import('./features/gift/pages/GiftChooserPage.tsx')
);
const GiftWizardPage = lazyWithReload(
  () => import('./features/gift/pages/GiftWizardPage.tsx')
);
const GiftSentRedirect = lazyWithReload(
  () => import('./features/gift/pages/GiftSentRedirect.tsx')
);
const GiftVerifyPage = lazyWithReload(
  () => import('./features/gift/pages/GiftVerifyPage.tsx')
);
const CareerCalculatorPage = lazyWithReload(
  () => import('./features/career/pages/CareerCalculatorPage.tsx')
);
const PersonalCalculatorPage = lazyWithReload(
  () => import('./features/personal/pages/PersonalCalculatorPage.tsx')
);
const DailyCalculatorPage = lazyWithReload(
  () => import('./features/daily/pages/DailyCalculatorPage.tsx')
);
const PrivacyPolicyPage = lazyWithReload(() => import('./pages/legal/PrivacyPolicyPage.tsx'));
const TermsPage = lazyWithReload(() => import('./pages/legal/TermsPage.tsx'));

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

/** Keeps the root ErrorBoundary from sticking after a failed lazy route load. */
function RoutedApp() {
  const { pathname } = useLocation();
  return (
    <ErrorBoundary resetKey={pathname}>
      <Routes>
        <Route
          path="/shared/:shareId"
          element={
            <Suspense fallback={null}>
              <SharedChatPage />
            </Suspense>
          }
        />
        <Route
          path="/gift"
          element={
            <Suspense fallback={null}>
              <GiftChooserPage />
            </Suspense>
          }
        />
        <Route
          path="/gift/verify"
          element={
            <Suspense fallback={null}>
              <GiftVerifyPage />
            </Suspense>
          }
        />
        <Route
          path="/gift/:slug/sent"
          element={
            <Suspense fallback={null}>
              <GiftSentRedirect />
            </Suspense>
          }
        />
        <Route
          path="/gift/:slug"
          element={
            <Suspense fallback={null}>
              <GiftWizardPage />
            </Suspense>
          }
        />
        <Route
          path="/career/r/:reportId"
          element={
            <Suspense fallback={null}>
              <CareerCalculatorPage />
            </Suspense>
          }
        />
        <Route
          path="/career"
          element={
            <Suspense fallback={null}>
              <CareerCalculatorPage />
            </Suspense>
          }
        />
        <Route
          path="/personal/r/:reportId"
          element={
            <Suspense fallback={null}>
              <PersonalCalculatorPage />
            </Suspense>
          }
        />
        <Route
          path="/personal"
          element={
            <Suspense fallback={null}>
              <PersonalCalculatorPage />
            </Suspense>
          }
        />
        <Route
          path="/daily/r/:reportId"
          element={
            <Suspense fallback={null}>
              <DailyCalculatorPage />
            </Suspense>
          }
        />
        <Route
          path="/daily"
          element={
            <Suspense fallback={null}>
              <DailyCalculatorPage />
            </Suspense>
          }
        />
        <Route
          path="/privacy"
          element={
            <Suspense fallback={null}>
              <PrivacyPolicyPage />
            </Suspense>
          }
        />
        <Route
          path="/terms"
          element={
            <Suspense fallback={null}>
              <TermsPage />
            </Suspense>
          }
        />
        <Route path="/" element={<HomeRoute />} />
        <Route
          path="/*"
          element={
            <Suspense fallback={null}>
              <App />
            </Suspense>
          }
        />
      </Routes>
    </ErrorBoundary>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <AnalyticsPageView />
        <RoutedApp />
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>,
);
