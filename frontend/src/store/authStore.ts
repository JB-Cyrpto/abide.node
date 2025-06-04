import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, password_DO_NOT_USE_IN_REAL_APP: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password_DO_NOT_USE_IN_REAL_APP: string) => Promise<void>;
  checkAuthStatus: () => void;
  clearError: () => void;
}

const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,
      error: null,

      login: async (email, password) => {
        set({ loading: true, error: null });
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));

        if (email === 'test@example.com' && password === 'password') {
          const mockUser: User = { id: '1', email };
          const mockToken = 'fake-jwt-token';
          set({ 
            user: mockUser, 
            token: mockToken, 
            isAuthenticated: true, 
            loading: false, 
            error: null 
          });
          localStorage.setItem('authToken', mockToken); // Persist token
          localStorage.setItem('authUser', JSON.stringify(mockUser));
          console.log('Mock login successful', mockUser);
        } else {
          const errorMessage = 'Invalid email or password';
          set({ loading: false, error: errorMessage, isAuthenticated: false, user: null, token: null });
          console.error('Mock login failed:', errorMessage);
          throw new Error(errorMessage);
        }
      },

      logout: async () => {
        set({ loading: true });
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
        set({ user: null, token: null, isAuthenticated: false, loading: false, error: null });
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
        console.log('Mock logout successful');
      },

      register: async (email, password) => {
        set({ loading: true, error: null });
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Simulate successful registration
        // In a real app, you might not log the user in immediately
        // or might require email verification.
        // For this mock, we'll just log success and clear loading/error.
        // We won't automatically log them in.
        console.log(`Mock registration successful for ${email} with password ${password}. User should now login.`);
        set({ loading: false, error: null });
        // Not setting isAuthenticated to true here; user should log in after registration.
      },

      checkAuthStatus: () => {
        console.log('Checking auth status...');
        const token = localStorage.getItem('authToken');
        const storedUser = localStorage.getItem('authUser');
        if (token && storedUser) {
          try {
            const user: User = JSON.parse(storedUser);
            set({ user, token, isAuthenticated: true, error: null });
            console.log('Auth status checked: User is authenticated.', user);
          } catch (e) {
            console.error("Error parsing stored user data", e);
            set({ user: null, token: null, isAuthenticated: false, error: 'Error loading user data.' });
            localStorage.removeItem('authToken');
            localStorage.removeItem('authUser');
          }
        } else {
          set({ user: null, token: null, isAuthenticated: false, error: null });
          console.log('Auth status checked: User is not authenticated.');
        }
      },
      clearError: () => {
        set({ error: null });
      }
    }),
    {
      name: 'auth-storage', // unique name for localStorage key
      storage: createJSONStorage(() => localStorage), // (optional) by default, 'localStorage' is used
      // Only persist parts of the store if needed, but for auth, token and user are common.
      // Here we persist the whole state, but `checkAuthStatus` will re-verify from localStorage.
      // We can choose not to persist everything or be more selective.
      // For simplicity, letting persist handle it, and checkAuthStatus will be the source of truth on load.
    }
  )
);

export default useAuthStore; 