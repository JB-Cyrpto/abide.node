import React, { useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  Outlet,
  Navigate
} from 'react-router-dom';

import VisualWorkflowPageWithProvider from './components/VisualWorkflowPage';
import EditorSwitcher from './components/EditorSwitcher'; // Assuming this is the main app view wrapper
import LoginPage from './components/auth/LoginPage';
import RegistrationPage from './components/auth/RegistrationPage';
import AuthStatus from './components/auth/AuthStatus';
import useAuthStore from './store/authStore';

// Placeholder for a protected route component
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  // const { isAuthenticated } = useAuthStore(); // Replace with actual auth check
  // const isAuthenticated = !!localStorage.getItem('mock_user_token'); // Simple mock
  const { isAuthenticated, loading } = useAuthStore();

  if (loading) {
    return <div>Loading authentication status...</div>; // Or a spinner component
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const AppLayout: React.FC = () => {
  return (
    <div className="app-container" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <header style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '0.5rem 1rem', background: '#fff', borderBottom: '1px solid #e2e8f0', boxShadow: 'sm'
      }}>
        <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2D3748' }}>Visual Workflow Canvas</h1>
        </Link>
        <AuthStatus />
      </header>
      <main style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {/* EditorSwitcher or VisualWorkflowPage will be rendered here by the Route */}
        <Outlet /> 
      </main>
      <footer style={{ textAlign: 'center', padding: '1rem', background: '#f7fafc', borderTop: '1px solid #e2e8f0', fontSize: '0.875rem', color: '#718096'}}>
        &copy; {new Date().getFullYear()} Visual Workflow App. All rights reserved.
      </footer>
    </div>
  );
};

function App() {
  const { checkAuthStatus } = useAuthStore();

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegistrationPage />} />
        <Route element={<AppLayout />}>
          {/* Main application route, protected later */}
          <Route 
            path="/"
            element={ (
              <ProtectedRoute>
                <EditorSwitcher /> // Or directly VisualWorkflowPageWithProvider if EditorSwitcher is not used for this
              </ProtectedRoute>
            )}
          />
          {/* Add other main app routes here if needed, wrapped by AppLayout */}
        </Route>
        {/* Catch-all or 404 route might be useful later */}
        {/* <Route path="*" element={<Navigate to="/" replace />} /> */}
      </Routes>
    </Router>
  );
}

export default App;