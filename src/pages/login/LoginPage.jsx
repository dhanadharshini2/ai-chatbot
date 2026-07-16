// src/pages/login/LoginPage.jsx
import { useMsal } from '@azure/msal-react';
import { loginRequest } from '../../auth/msalConfig';
import './LoginPage.css';

function LoginPage() {
  const { instance } = useMsal();

  const handleLogin = () => {
    instance.loginRedirect(loginRequest).catch((err) => {
      console.error('Login failed:', err);
    });
  };

  return (
    <div className="login-page">
      <div className="login-card">
        {/* Branding */}
        <div className="login-brand">
          <div className="login-logo">
            <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="20" cy="20" r="20" fill="#0066A1" />
              <path d="M12 14h6c3.3 0 6 2.7 6 6s-2.7 6-6 6h-2v4h-4V14zm4 8h2c1.1 0 2-.9 2-2s-.9-2-2-2h-2v4z" fill="white" />
            </svg>
          </div>
          <div className="login-brand-text">
            <span className="login-brand-philips">Philips</span>
            <span className="login-brand-ignite">Ignite</span>
          </div>
        </div>

        <h1 className="login-title">IB Intelligence</h1>
        <p className="login-subtitle">
          AI-powered Installed Base insights for commercial and service engineers
        </p>

        <button className="login-btn-microsoft" onClick={handleLogin}>
          {/* Microsoft logo SVG */}
          <svg className="ms-logo" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg">
            <rect x="0" y="0" width="10" height="10" fill="#F25022" />
            <rect x="11" y="0" width="10" height="10" fill="#7FBA00" />
            <rect x="0" y="11" width="10" height="10" fill="#00A4EF" />
            <rect x="11" y="11" width="10" height="10" fill="#FFB900" />
          </svg>
          Sign in with Microsoft
        </button>

        <p className="login-note">
          Use your <strong>Philips</strong> organizational account
        </p>

        {/* Feature highlights */}
        <div className="login-features">
          <div className="login-feature">
            <span className="login-feature-icon">🏥</span>
            <span>Account &amp; IB Search</span>
          </div>
          <div className="login-feature">
            <span className="login-feature-icon">📋</span>
            <span>Contract &amp; Renewal Status</span>
          </div>
          <div className="login-feature">
            <span className="login-feature-icon">⚠️</span>
            <span>EOL / EOS Lifecycle Alerts</span>
          </div>
          <div className="login-feature">
            <span className="login-feature-icon">🔍</span>
            <span>Coverage Gap Insights</span>
          </div>
        </div>
      </div>

      <p className="login-footer">
        © {new Date().getFullYear()} Philips — Powered by Azure OpenAI &amp; Ignite Agents
      </p>
    </div>
  );
}

export default LoginPage;
