import { createRoot } from 'react-dom/client'
import { Toaster } from 'sonner'
import { HelmetProvider } from 'react-helmet-async'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { TenantProvider } from './context/TenantContext';
import { TutorialProvider } from './context/TutorialContext';
import { cacheManager } from './utils/cacheManager';

// Initialize cache manager to clear stale data
cacheManager.init();

createRoot(document.getElementById('root')!).render(
  <HelmetProvider>
    <LanguageProvider>
      <AuthProvider>
        <TenantProvider>
          <TutorialProvider>
            <App />
          </TutorialProvider>
        </TenantProvider>
      </AuthProvider>
      <Toaster position="top-center" richColors closeButton />
    </LanguageProvider>
  </HelmetProvider>,
)
