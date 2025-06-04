import React, { useState, FormEvent, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isAuthenticated, error, loading, clearError } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/'); // Redirect to home if already authenticated
    }
    return () => {
      clearError(); // Clear any errors when component unmounts or before new attempt
    };
  }, [isAuthenticated, navigate, clearError]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await login(email, password); // Call actual login function from store/service
      // Redirect or update UI on successful login
      // Navigation is handled by useEffect
      console.log('Login successful');
    } catch (err: any) {
      // Error is set in the store by the login action itself
      // setError(err.message || 'Failed to login. Please check your credentials.');
      console.error('Login failed in component:', err.message);
    }
    // setLoading(false); // Handled by store
    // For now, just log and clear
    // alert(`Simulated login for ${email}. In a real app, you'd be redirected.`);
    // setEmail(''); // Keep fields for retry unless successful
    // setPassword('');
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 200px)', 
      padding: '20px', background: '#f0f2f5' // Light gray background
    }}>
      <div style={{
        background: 'white', padding: '40px', borderRadius: '8px', 
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)', width: '100%', maxWidth: '400px'
      }}>
        <h2 style={{ textAlign: 'center', marginBottom: '30px', color: '#333' }}>Login to Your Account</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="email" style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#555' }}>Email Address</label>
            <input 
              type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)}
              required style={{ width: 'calc(100% - 20px)', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }} 
              placeholder="you@example.com"
            />
          </div>
          <div style={{ marginBottom: '25px' }}>
            <label htmlFor="password" style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#555' }}>Password</label>
            <input 
              type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)}
              required style={{ width: 'calc(100% - 20px)', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }} 
              placeholder="••••••••"
              disabled={loading}
            />
          </div>
          {error && <p style={{ color: 'red', textAlign: 'center', fontSize: '0.9em', marginBottom:'15px' }}>{error}</p>}
          <button 
            type="submit" 
            disabled={loading}
            style={{
              width: '100%', padding: '12px', background: loading ? '#ccc' : '#007bff', 
              color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', 
              fontSize: '1em', fontWeight: 'bold', transition: 'background-color 0.2s ease'
            }}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '25px', fontSize: '0.9em', color: '#555' }}>
          Don't have an account? <a href="/register" style={{ color: '#007bff', textDecoration: 'none' }}>Sign up</a>
          {/* Later, use React Router Link: <Link to="/register">Sign up</Link> */}
        </p>
      </div>
    </div>
  );
};

export default LoginPage; 