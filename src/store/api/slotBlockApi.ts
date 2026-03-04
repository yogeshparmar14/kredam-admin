import { baseApi } from './baseApi';
import type { ISlotBlock } from '../../types';

interface CreateSlotBlockBody {
  arenaId: string;
  date: string;
  startTime: string;
  endTime: string;
  reason: string;
  courtId?: string;
  sportId?: string;
}

export const slotBlockApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSlotBlocks: builder.query<
      ISlotBlock[],
      { arenaId?: string; date?: string; isReleased?: boolean }
    >({
      query: (params) => ({ url: '/slot-blocks', params }),
      transformResponse: (response: { data: ISlotBlock[] }) => response.data,
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
