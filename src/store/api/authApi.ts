import { baseApi } from './baseApi';
import type { RolePermissions, CompanyContext, User } from '../../types';

interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest {
  name: string;
  email: string;
  phone: string;
  password: string;
}

interface ForgotPasswordRequest {
  email: string;
}

interface ResetPasswordRequest {
  token: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  permissions: RolePermissions;
  company: CompanyContext | null;
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
      transformResponse: (response: { data: LoginResponse }) => response.data,
    }),
    register: builder.mutation<void, RegisterRequest>({
      query: (body) => ({ url: '/auth/register', method: 'POST', body }),
    }),
    forgotPassword: builder.mutation<{ message: string }, ForgotPasswordRequest>({
      query: (body) => ({ url: '/auth/forgot-password', method: 'POST', body }),
    }),
    resetPassword: builder.mutation<void, ResetPasswordRequest>({
      query: (body) => ({ url: '/auth/reset-password', method: 'POST', body }),
    }),
    logout: builder.mutation<void, void>({
      query: () => ({ url: '/auth/logout', method: 'POST' }),
    }),
    getMe: builder.query<{ user: User; permissions: RolePermissions; company: CompanyContext | null }, void>({
      query: () => '/auth/me',
      transformResponse: (response: { data: { user: User; permissions: RolePermissions; company: CompanyContext | null } }) => response.data,
      providesTags: ['Auth'],
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useLogoutMutation,
  useGetMeQuery,
} = authApi;
