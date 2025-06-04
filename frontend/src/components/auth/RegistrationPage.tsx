import React, { useState, FormEvent, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

const RegistrationPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMatchError, setPasswordMatchError] = useState<string | null>(null);
  const { register, loading, error, clearError, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
    return () => {
      clearError();
      setPasswordMatchError(null);
    };
  }, [isAuthenticated, navigate, clearError]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    clearError();
    setPasswordMatchError(null);

    if (password !== confirmPassword) {
      setPasswordMatchError('Passwords do not match.');
      return;
    }
    try {
      await register(email, password);
      console.log('Registration successful in component');
      alert('Registration successful! Please log in.');
      navigate('/login');
    } catch (err: any) {
      console.error('Registration failed in component:', err.message);
    }
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 200px)', 
      padding: '20px', background: '#f0f2f5'
    }}>
      <div style={{
        background: 'white', padding: '40px', borderRadius: '8px', 
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)', width: '100%', maxWidth: '400px'
      }}>
        <h2 style={{ textAlign: 'center', marginBottom: '30px', color: '#333' }}>Create Your Account</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="emailReg" style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#555' }}>Email Address</label>
            <input 
              type="email" id="emailReg" value={email} onChange={(e) => setEmail(e.target.value)}
              required style={{ width: 'calc(100% - 20px)', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }} 
              placeholder="you@example.com"
            />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="passwordReg" style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#555' }}>Password</label>
            <input 
              type="password" id="passwordReg" value={password} onChange={(e) => setPassword(e.target.value)}
              required style={{ width: 'calc(100% - 20px)', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }} 
              placeholder="Create a strong password"
            />
          </div>
          <div style={{ marginBottom: '25px' }}>
            <label htmlFor="confirmPasswordReg" style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#555' }}>Confirm Password</label>
            <input 
              type="password" id="confirmPasswordReg" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
              required style={{ width: 'calc(100% - 20px)', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }} 
              placeholder="Repeat your password"
              disabled={loading}
            />
          </div>
          {passwordMatchError && <p style={{ color: 'red', textAlign: 'center', fontSize: '0.9em', marginBottom:'15px' }}>{passwordMatchError}</p>}
          {error && <p style={{ color: 'red', textAlign: 'center', fontSize: '0.9em', marginBottom:'15px' }}>{error}</p>}
          <button 
            type="submit" 
            disabled={loading}
            style={{
              width: '100%', padding: '12px', background: loading ? '#ccc' : '#28a745',
              color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', 
              fontSize: '1em', fontWeight: 'bold', transition: 'background-color 0.2s ease'
            }}
          >
            {loading ? 'Registering...' : 'Create Account'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '25px', fontSize: '0.9em', color: '#555' }}>
          Already have an account? <a href="/login" style={{ color: '#007bff', textDecoration: 'none' }}>Log in</a>
        </p>
      </div>
    </div>
  );
};

export default RegistrationPage; 