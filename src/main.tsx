import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router";
import { AuthProvider } from "./lib/AuthContext";
import { isMissingConfig } from "./lib/supabase";
import App from "./app/App.tsx";
import { AdminApp } from "./app/admin/AdminApp.tsx";
import "./styles/index.css";

const root = createRoot(document.getElementById("root")!);

if (isMissingConfig) {
  root.render(
    <div style={{
      minHeight: '100vh',
      background: '#FFFBF5',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, sans-serif',
      padding: '24px',
      textAlign: 'center',
    }}>
      <div style={{ maxWidth: 400 }}>
        <div style={{
          width: 56, height: 56,
          background: '#FEE2E2',
          borderRadius: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px',
          fontSize: 24, fontWeight: 700, color: '#DC2626',
        }}>!</div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1C1917', marginBottom: 8 }}>
          Configuration Missing
        </h1>
        <p style={{ fontSize: 14, color: '#78716C', lineHeight: 1.6 }}>
          Environment variables <code style={{ background: '#F5F5F4', padding: '2px 6px', borderRadius: 4 }}>VITE_SUPABASE_URL</code> and{' '}
          <code style={{ background: '#F5F5F4', padding: '2px 6px', borderRadius: 4 }}>VITE_SUPABASE_ANON_KEY</code>{' '}
          are missing. Add them in Vercel → Project → Settings → Environment Variables, then redeploy.
        </p>
      </div>
    </div>
  );
} else {
  root.render(
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/admin/*" element={<AdminApp />} />
          <Route path="/*" element={<App />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
