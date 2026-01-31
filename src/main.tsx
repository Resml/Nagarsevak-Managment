import { createRoot } from 'react-dom/client'
import { Toaster } from 'sonner'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';

createRoot(document.getElementById('root')!).render(
  <LanguageProvider>
    <AuthProvider>
      <Toaster position="top-center" richColors closeButton />
      <App />
    </AuthProvider>
  </LanguageProvider>,
)
