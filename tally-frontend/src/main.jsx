import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import EarthLoader from './EarthLoader.jsx'

function Root() {
  const [isLoading, setIsLoading] = useState(() => {
    try {
      return !sessionStorage.getItem('tc_app_initialized');
    } catch {
      return false;
    }
  });

  return (
    <>
      <App />
      {isLoading && (
        <EarthLoader
          minDuration={1600}
          onComplete={() => {
            try { sessionStorage.setItem('tc_app_initialized', '1'); } catch {}
            setIsLoading(false);
          }}
        />
      )}
    </>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
