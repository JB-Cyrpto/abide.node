import React from 'react';
import { Link } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { FiUser, FiLogOut, FiLogIn } from 'react-icons/fi';

// interface User { // Defined in store
//   email: string;
//   // add other user properties like name, avatarUrl etc.
// }

const AuthStatus: React.FC = () => {
  // Simulate auth state. Replace with actual store logic.
  // const [currentUser, setCurrentUser] = useState<User | null>(null);
  const { user, logout, isAuthenticated, loading } = useAuthStore();

  // const handleMockLogin = () => {
  //   setCurrentUser({ email: 'user@example.com' }); // Mock login
  //   // In real app, this would be a redirect to /login or similar
  // };

  const handleLogout = async () => {
    console.log('Logout action triggered from AuthStatus');
    await logout(); // Call actual logout from store/service
    // setCurrentUser(null); // Clear mock user - handled by store
    alert('You have been logged out.'); // Feedback
    // Navigation to /login might be desired here, or handled by ProtectedRoute
  };

  if (loading) {
    return <div style={{ padding: '10px 20px', color: '#4A5568' }}>Checking status...</div>;
  }

  if (!isAuthenticated || !user) {
    return (
      <div style={{ padding: '10px 20px', display:'flex', alignItems:'center' }}>
        {/* This mock login button is just for testing the display, remove in real app */}
        {/* <button 
            onClick={handleMockLogin} 
            style={{
                background: 'transparent', border: 'none', color: '#4A5568', 
                cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize: '0.9em'
            }}
            title="Mock Login"
        >
            <FiLogIn style={{ marginRight: '8px' }}/> Mock Login
        </button> */}
        <Link to="/login" style={{color: '#4A5568', textDecoration: 'none', display:'flex', alignItems:'center', fontSize: '0.9em'}}>
            <FiLogIn style={{marginRight: '8px'}}/> Login
        </Link>
        <span style={{margin: '0 8px', color: '#CBD5E0'}}>|</span>
        <Link to="/register" style={{color: '#4A5568', textDecoration: 'none', display:'flex', alignItems:'center', fontSize: '0.9em'}}>
            Register
        </Link>
      </div>
    );
  }

  return (
    <div style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', color: '#4A5568' }}>
      <FiUser style={{ marginRight: '8px' }} />
      <span style={{ marginRight: '15px', fontSize: '0.9em' }}>{user.email}</span>
      <button 
        onClick={handleLogout}
        style={{
            background: 'transparent', border: 'none', color: '#E53E3E', /* Red for logout */
            cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize: '0.9em'
        }}
        title="Logout"
      >
        <FiLogOut style={{ marginRight: '5px' }} /> Logout
      </button>
    </div>
  );
};

export default AuthStatus; 