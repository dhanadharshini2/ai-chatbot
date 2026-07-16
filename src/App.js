import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { PublicClientApplication } from '@azure/msal-browser';
import { MsalProvider } from '@azure/msal-react';
import { msalConfig } from './auth/msalConfig';
import RequireAuth from './auth/RequireAuth';
import ChatPage from './pages/chat/ChatPage';
import './App.css';

const msalInstance = new PublicClientApplication(msalConfig);

function App() {
  const [msalReady, setMsalReady] = useState(false);

  useEffect(() => {
    msalInstance.initialize().then(() => {
      setMsalReady(true);
    });
  }, []);

  if (!msalReady) return <div>Loading...</div>;

  return (
    <BrowserRouter>
      <MsalProvider instance={msalInstance}>
        <RequireAuth>
          <Routes>
            <Route path="/" element={<Navigate to="/chat" replace />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/chat/:conversationId" element={<ChatPage />} />
          </Routes>
        </RequireAuth>
      </MsalProvider>
    </BrowserRouter>
  );
}

export default App;