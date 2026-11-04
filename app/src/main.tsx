import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { installContent } from './content/index'
import './ui/styles.css'
import { App } from './ui/App'
import { installDebugHooks } from './ui/debugHooks'

installContent()
if (new URLSearchParams(location.search).has('debug') || import.meta.env.DEV) installDebugHooks()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
