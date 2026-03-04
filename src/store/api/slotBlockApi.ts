import { baseApi } from './baseApi';
import type { ISlotBlock, IPaginatedResponse } from '../../types';

interface CreateSlotBlockBody {
  arenaId: string;
  date: string;
  startTime: string;
  endTime: string;
  reason: string;
  mode: 'court' | 'sport';
  courtId?: string;
  sportId?: string;
}

export const slotBlockApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSlotBlocks: builder.query<
      IPaginatedResponse<ISlotBlock[]>,
      { arenaId?: string; date?: string; isReleased?: boolean; page?: number; limit?: number }
    >({
      query: (params) => ({ url: '/slot-blocks', params }),
      transformResponse: (response: { data: IPaginatedResponse<ISlotBlock[]> }) => response.data,
      providesTags: ['SlotBlock'],
    }),
    createSlotBlock: builder.mutation<void, CreateSlotBlockBody>({
      query: (body) => ({ url: '/slot-blocks', method: 'POST', body }),
      invalidatesTags: ['SlotBlock'],
    }),
    releaseSlotBlock: builder.mutation<void, string>({
      query: (id) => ({ url: `/slot-blocks/${id}/release`, method: 'PATCH' }),
      invalidatesTags: ['SlotBlock'],
    }),
  }),
});

export const {
  useGetSlotBlocksQuery,
  useCreateSlotBlockMutation,
  useReleaseSlotBlockMutation,
} = slotBlockApi;
