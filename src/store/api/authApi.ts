import { baseApi } from './baseApi';
import type { IApiResponse, RolePermissions, CompanyContext, User } from '../../types';

interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  user: User;
  accessToken: string;
  permissions: RolePermissions;
  company: CompanyContext | null;
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<IApiResponse<LoginResponse>, LoginRequest>({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
    }),
    logout: builder.mutation<void, void>({
      query: () => ({ url: '/auth/logout', method: 'POST' }),
    }),
    getMe: builder.query<IApiResponse<{ user: User; permissions: RolePermissions; company: CompanyContext | null }>, void>({
      query: () => '/auth/me',
      providesTags: ['Auth'],
    }),
  }),
});

export const { useLoginMutation, useLogoutMutation, useGetMeQuery } = authApi;
