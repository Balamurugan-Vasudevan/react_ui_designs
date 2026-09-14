import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import AudioDetailPage from './AudioDetailPage.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AudioDetailPage />
  </StrictMode>,
)
