import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App.tsx'
import { AuthProvider } from './context/AuthContext.tsx'
import { PortalDataProvider } from './context/PortalData.tsx'
import { ThemeProvider } from './context/ThemeContext.tsx'
import './styles.css'

const root = document.getElementById('root')
if (!root) throw new Error('Немає #root')

createRoot(root).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <PortalDataProvider>
          <App />
        </PortalDataProvider>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
)
