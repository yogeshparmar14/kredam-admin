import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../../constants';
import type { User, CompanyContext, RolePermissions } from '../../types';

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  permissions: RolePermissions | null;
  company: CompanyContext | null;
  isPlatformOwner: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  permissions: null,
  company: null,
  isPlatformOwner: false,
  isAuthenticated: false,
  isLoading: true,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{
        user: User;
        accessToken: string;
        permissions?: RolePermissions;
        company?: CompanyContext | null;
      }>,
    ) => {
      const { user, accessToken, permissions, company } = action.payload;
      state.user = user;
      state.accessToken = accessToken;
      state.permissions = permissions ?? null;
      state.company = company ?? null;
      state.isPlatformOwner = user?.role === 'platform_owner';
      state.isAuthenticated = true;
      state.isLoading = false;
      // Persist to AsyncStorage (fire-and-forget)
      AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
      AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      if (permissions) AsyncStorage.setItem(STORAGE_KEYS.PERMISSIONS, JSON.stringify(permissions));
      if (company) AsyncStorage.setItem(STORAGE_KEYS.COMPANY, JSON.stringify(company));
    },

    clearCredentials: (state) => {
      state.user = null;
      state.accessToken = null;
      state.permissions = null;
      state.company = null;
      state.isPlatformOwner = false;
      state.isAuthenticated = false;
      state.isLoading = false;
      AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
    },

    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
});

export const { setCredentials, clearCredentials, setLoading } = authSlice.actions;
export default authSlice.reducer;
