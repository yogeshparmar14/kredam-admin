import { baseApi } from './baseApi';
import type { ISport } from '../../types';

interface SportBody {
  name: string;
  type?: 'indoor' | 'outdoor' | 'both';
}

export const sportApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSports: builder.query<ISport[], void>({
      query: () => '/sports',
      transformResponse: (response: { data: ISport[] }) => response.data,
      providesTags: ['Sport'],
    }),
    createSport: builder.mutation<void, SportBody>({
      query: (body) => ({ url: '/sports', method: 'POST', body }),
      invalidatesTags: ['Sport'],
    }),
    updateSport: builder.mutation<void, { id: string } & SportBody>({
      query: ({ id, ...body }) => ({ url: `/sports/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Sport'],
    }),
  }),
});

export const {
  useGetSportsQuery,
  useCreateSportMutation,
  useUpdateSportMutation,
} = sportApi;
