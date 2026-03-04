import { baseApi } from './baseApi';
import type { IArena, IPaginatedResponse } from '../../types';

interface ArenaBody {
  name: string;
  code?: string;
  address?: { street?: string; city?: string; state?: string };
  operatingHours?: { open: string; close: string };
}

export const arenaApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getArenas: builder.query<IPaginatedResponse<IArena[]>, { page?: number; limit?: number }>({
      query: (params) => ({ url: '/arenas', params }),
      transformResponse: (response: { data: IPaginatedResponse<IArena[]> }) => response.data,
      providesTags: ['Arena'],
    }),
    createArena: builder.mutation<void, ArenaBody>({
      query: (body) => ({ url: '/arenas', method: 'POST', body }),
      invalidatesTags: ['Arena'],
    }),
    updateArena: builder.mutation<void, { id: string } & ArenaBody>({
      query: ({ id, ...body }) => ({ url: `/arenas/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Arena'],
    }),
  }),
});

export const {
  useGetArenasQuery,
  useCreateArenaMutation,
  useUpdateArenaMutation,
} = arenaApi;
