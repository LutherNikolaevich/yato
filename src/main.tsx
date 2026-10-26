import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

if (new URLSearchParams(location.search).has('nomotion'))
  document.documentElement.setAttribute('data-nomotion', '')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
