import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ApiUser, ApiTenant } from '../lib/api';

interface AuthState {
  user: ApiUser | null;
  tenant: ApiTenant | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  setAuth: (user: ApiUser, tenant: ApiTenant, token: string) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
  updateUser: (user: Partial<ApiUser>) => void;
  updateTenant: (tenant: Partial<ApiTenant>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      tenant: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      setAuth: (user, tenant, token) => {
        localStorage.setItem('auth_token', token);
        set({
          user,
          tenant,
          token,
          isAuthenticated: true,
          isLoading: false,
        });
      },

      clearAuth: () => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        set({
          user: null,
          tenant: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      setLoading: (loading) => set({ isLoading: loading }),

      updateUser: (userData) => {
        const currentUser = get().user;
        if (currentUser) {
          set({ user: { ...currentUser, ...userData } });
        }
      },

      updateTenant: (tenantData) => {
        const currentTenant = get().tenant;
        if (currentTenant) {
          set({ tenant: { ...currentTenant, ...tenantData } });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        tenant: state.tenant, 
        token: state.token,
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);