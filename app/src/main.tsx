import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { installContent } from './content/index'

installContent()

function Placeholder() {
  return <div style={{ font: '16px system-ui', padding: 24 }}>Slay the Football</div>
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Placeholder />
  </StrictMode>,
)
