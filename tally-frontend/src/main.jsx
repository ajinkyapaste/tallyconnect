import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import VideoLoader from './VideoLoader.jsx'

function Root() {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <>
      <App />
      {isLoading && (
        <VideoLoader
          minDuration={2300}
          onComplete={() => {
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
