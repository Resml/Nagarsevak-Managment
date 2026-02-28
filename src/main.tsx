import { createRoot } from 'react-dom/client'
import { Toaster } from 'sonner'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { TenantProvider } from './context/TenantContext';
import { cacheManager } from './utils/cacheManager';

// Initialize cache manager to clear stale data
cacheManager.init();

createRoot(document.getElementById('root')!).render(
  <LanguageProvider>
    <AuthProvider>
      <TenantProvider>
        <App />
      </TenantProvider>
    </AuthProvider>
    <Toaster position="top-center" richColors closeButton />
  </LanguageProvider>,
)
