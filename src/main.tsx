import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App.tsx'
import { AuthProvider } from './context/AuthContext.tsx'
import { CatalogProvider } from './context/CatalogData.tsx'
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
          <CatalogProvider>
            <App />
          </CatalogProvider>
        </PortalDataProvider>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
)
