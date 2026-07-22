import { Toaster } from 'react-hot-toast'
import './index.css'
import './App.css'

import Routing from './Routing/Routing'
import ComingSoon from './Pages/ComingSoon'
import ErrorBoundary from './Components/ErrorBoundary/ErrorBoundary'
import { config } from './config'

function App() {
  // If maintenance mode is on, only show Coming Soon page
  if (config.isMaintenanceMode) {
    return (
      <>
        <Toaster position="top-right" />
        <ComingSoon />
      </>
    );
  }

  return (
    <>
      <Toaster 
        position="top-right" 
        reverseOrder={false} 
        containerStyle={{ zIndex: 9999 }}
        toastOptions={{
          success: {
            style: {
              background: '#4ade80',
              color: '#fff',
              fontWeight: '500',
            },
            iconTheme: {
              primary: '#fff',
              secondary: '#4ade80',
            },
          },
          error: {
            style: {
              background: '#f87171',
              color: '#fff',
              fontWeight: '500',
            },
            iconTheme: {
              primary: '#fff',
              secondary: '#f87171',
            },
          },
        }}
      />
      <div className='App reveal-in'>
        <ErrorBoundary>
          <Routing/>
        </ErrorBoundary>
      </div>
    </>
  )
}

export default App
