import { baseApi } from './baseApi';
import type { IUser, IPaginatedResponse } from '../../types';

interface CreateUserBody {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: string;
  arena?: string;
}

export const userApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getUsers: builder.query<IPaginatedResponse<IUser[]>, { page?: number; limit?: number; search?: string }>({
      query: (params) => ({ url: '/users', params }),
      transformResponse: (response: { data: IPaginatedResponse<IUser[]> }) => response.data,
      providesTags: ['User'],
    }),
    createUser: builder.mutation<void, CreateUserBody>({
      query: (body) => ({ url: '/users', method: 'POST', body }),
      invalidatesTags: ['User'],
    }),
    updateUser: builder.mutation<void, { id: string } & Partial<Omit<CreateUserBody, 'password'> & { isActive?: boolean; password?: string }>>({
      query: ({ id, ...body }) => ({ url: `/users/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['User'],
    }),
  }),
});

export const { useGetUsersQuery, useCreateUserMutation, useUpdateUserMutation } = userApi;
