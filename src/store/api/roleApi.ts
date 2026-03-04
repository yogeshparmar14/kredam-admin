import { baseApi } from './baseApi';
import type { IRole, ModulePermissions } from '../../types';

interface CreateRoleBody {
  name: string;
  displayName: string;
  description?: string;
  permissions: Record<string, ModulePermissions>;
}

interface UpdateRoleBody {
  displayName?: string;
  description?: string;
  permissions?: Record<string, ModulePermissions>;
  isActive?: boolean;
}

export const roleApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getRoles: builder.query<IRole[], void>({
      query: () => '/roles',
      transformResponse: (response: { data: IRole[] }) => response.data,
      providesTags: ['Role'],
    }),
    getModules: builder.query<string[], void>({
      query: () => '/roles/modules',
      transformResponse: (response: { data: string[] }) => response.data,
    }),
    createRole: builder.mutation<void, CreateRoleBody>({
      query: (body) => ({ url: '/roles', method: 'POST', body }),
      invalidatesTags: ['Role'],
    }),
    updateRole: builder.mutation<void, { id: string } & UpdateRoleBody>({
      query: ({ id, ...body }) => ({ url: `/roles/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Role', 'Auth'],
    }),
    deleteRole: builder.mutation<void, string>({
      query: (id) => ({ url: `/roles/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Role'],
    }),
  }),
});

export const {
  useGetRolesQuery,
  useGetModulesQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useDeleteRoleMutation,
} = roleApi;
