import { createRoot } from 'react-dom/client'
import { Toaster } from 'sonner'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { TenantProvider } from './context/TenantContext';

createRoot(document.getElementById('root')!).render(
  <LanguageProvider>
    <AuthProvider>
      <TenantProvider>
        <Toaster position="top-center" richColors closeButton />
        <App />
      </TenantProvider>
    </AuthProvider>
  </LanguageProvider>,
)
