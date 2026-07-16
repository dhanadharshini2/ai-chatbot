// src/auth/useAccessToken.js
// Hook to silently acquire an access token for API calls
// Falls back to interactive login if silent acquisition fails
import { useMsal } from '@azure/msal-react';
import { InteractionRequiredAuthError } from '@azure/msal-browser';
import { apiTokenRequest } from './msalConfig';

function useAccessToken() {
  const { instance, accounts } = useMsal();

  const getToken = async () => {
    if (!accounts || accounts.length === 0) {
      throw new Error('No authenticated account found.');
    }

    const request = {
      ...apiTokenRequest,
      account: accounts[0],
    };

    try {
      // Try silent acquisition first (uses cache)
      const result = await instance.acquireTokenSilent(request);
      return result.accessToken;
    } catch (error) {
      if (error instanceof InteractionRequiredAuthError) {
        // Silent failed (expired, consent needed) — show popup
        const result = await instance.acquireTokenPopup(request);
        return result.accessToken;
      }
      throw error;
    }
  };

  return { getToken };
}

export default useAccessToken;
