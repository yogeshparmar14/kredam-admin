import { baseApi } from './baseApi';
import type { ICourt, ICourtPricingRule } from '../../types';

interface CourtBody {
  name: string;
  arenaId: string;
  sportId?: string;
  defaultPrice?: number;
  pricing?: ICourtPricingRule[];
}

export const courtApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCourts: builder.query<ICourt[], { arenaId?: string }>({
      query: (params) => ({ url: '/courts', params }),
      transformResponse: (response: { data: ICourt[] }) => response.data,
      providesTags: ['Court'],
    }),
    createCourt: builder.mutation<void, CourtBody>({
      query: (body) => ({ url: '/courts', method: 'POST', body }),
      invalidatesTags: ['Court'],
    }),
    updateCourt: builder.mutation<void, { id: string } & Partial<CourtBody>>({
      query: ({ id, ...body }) => ({ url: `/courts/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Court'],
    }),
  }),
});

export const {
  useGetCourtsQuery,
  useCreateCourtMutation,
  useUpdateCourtMutation,
} = courtApi;
