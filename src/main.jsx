import React from 'react'
import ReactDOM from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'

// Import your Clerk publishable key from environment variables
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  console.error("❌ Missing Clerk Publishable Key!")
  console.error("Please:")
  console.error("1. Create a .env file in the root directory")
  console.error("2. Add: VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here")
  console.error("3. Restart the dev server (npm run dev)")
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {PUBLISHABLE_KEY ? (
      <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ClerkProvider>
    ) : (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh',
        padding: '2rem',
        textAlign: 'center',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <h1 style={{ color: '#dc2626', marginBottom: '1rem' }}>⚠️ Missing Clerk Key</h1>
        <p style={{ color: '#525252', marginBottom: '0.5rem' }}>
          Please set VITE_CLERK_PUBLISHABLE_KEY in your .env file
        </p>
        <p style={{ color: '#737373', fontSize: '0.9rem' }}>
          Then restart the dev server with: <code style={{ background: '#f3f4f6', padding: '2px 6px', borderRadius: '4px' }}>npm run dev</code>
        </p>
      </div>
    )}
  </React.StrictMode>,
)

