import { baseApi } from './baseApi';
import type { RolePermissions, CompanyContext, User } from '../../types';

interface LoginRequest {
  email: string;
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
    logout: builder.mutation<void, void>({
      query: () => ({ url: '/auth/logout', method: 'POST' }),
      invalidatesTags: ['Auth'],
    }),
    getMe: builder.query<{ user: User; permissions: RolePermissions; company: CompanyContext | null }, void>({
      query: () => '/auth/me',
      transformResponse: (response: { data: { user: User; permissions: RolePermissions; company: CompanyContext | null } }) => response.data,
      providesTags: ['Auth'],
    }),
  }),
});

export const { useLoginMutation, useLogoutMutation, useGetMeQuery } = authApi;
