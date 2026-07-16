// src/auth/RequireAuth.jsx
// Route guard: shows login page if user is not authenticated via Entra ID
import { useIsAuthenticated, useMsal } from '@azure/msal-react';
import { InteractionStatus } from '@azure/msal-browser';
import { loginRequest } from './msalConfig';
import LoginPage from '../pages/login/LoginPage';

function RequireAuth({ children }) {
    console.log("RequireAuth rendered");
  const isAuthenticated = useIsAuthenticated();
  const { inProgress } = useMsal();

  // Handle redirect processing FIRST
  if (inProgress === InteractionStatus.Startup || inProgress === InteractionStatus.HandleRedirect) {
    return <div>Loading authentication status...</div>;
  }
  
  // Then handle any other in-progress interaction
  console.log("inProgress", inProgress);
  if (inProgress !== InteractionStatus.None) {
    return (
      <div className="auth-loading">
        <div className="auth-loading-spinner" />
        <p>Signing you in...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage loginRequest={loginRequest} />;
  }

  return children;
}

export default RequireAuth;
