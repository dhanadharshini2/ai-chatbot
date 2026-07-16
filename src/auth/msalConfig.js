// src/auth/msalConfig.js
// Microsoft Entra ID (Azure AD) MSAL configuration
// Uses Authorization Code Flow with PKCE — the recommended flow for SPAs

export const msalConfig = {
  auth: {
    clientId: process.env.REACT_APP_CLIENT_ID || '',
    authority: `https://login.microsoftonline.com/${process.env.REACT_APP_TENANT_ID || 'common'}`,
    redirectUri: window.location.origin,
    postLogoutRedirectUri: window.location.origin,
  },
  cache: {
    // sessionStorage: cleared on tab close — safer than localStorage for tokens
    // cacheLocation: 'sessionStorage',
    // storeAuthStateInCookie: false,
        cacheLocation: "localStorage", // Stores data in local storage
        storeAuthStateInCookie: true,
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) return; // never log PII
        if (process.env.NODE_ENV === 'development') {
          console.log(`[MSAL] ${message}`);
        }
      },
    },
  },
};

// Scopes requested at login (openid + profile = basic identity)
export const loginRequest = {
  scopes: [
    'openid',
    'profile',
    'User.Read',
    ...(process.env.REACT_APP_API_SCOPE ? [process.env.REACT_APP_API_SCOPE] : []),
  ],
};

// Silent token acquisition scopes for calling the backend REST API
export const apiTokenRequest = {
  scopes: [
    process.env.REACT_APP_API_SCOPE || 'User.Read',
  ],
};
