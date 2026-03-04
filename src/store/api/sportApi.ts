import { baseApi } from './baseApi';
import type { ISport } from '../../types';

interface SportBody {
  name: string;
  slotDuration: number;
  defaultPrice: number;
}

interface CreateSportBody extends SportBody {
  arena: string;
}

export const sportApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSportsByArena: builder.query<ISport[], string>({
      query: (arenaId) => `/sports/arena/${arenaId}`,
      transformResponse: (response: { data: ISport[] }) => response.data,
      providesTags: ['Sport'],
    }),
    createSport: builder.mutation<void, CreateSportBody>({
      query: (body) => ({ url: '/sports', method: 'POST', body }),
      invalidatesTags: ['Sport'],
    }),
    updateSport: builder.mutation<void, { id: string } & Partial<SportBody>>({
      query: ({ id, ...body }) => ({ url: `/sports/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Sport'],
    }),
  }),
});

export const {
  useGetSportsByArenaQuery,
  useCreateSportMutation,
  useUpdateSportMutation,
} = sportApi;
