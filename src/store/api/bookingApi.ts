import { baseApi } from './baseApi';
import type { IBooking, IPaginatedResponse } from '../../types';

interface GetBookingsParams {
  page?: number;
  limit?: number;
  status?: string;
  arenaId?: string;
  date?: string;
}

export const bookingApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getBookings: builder.query<IPaginatedResponse<IBooking[]>, GetBookingsParams>({
      query: (params) => ({ url: '/bookings', params }),
      transformResponse: (response: { data: IPaginatedResponse<IBooking[]> }) => response.data,
      providesTags: ['Booking'],
    }),
    getBookingById: builder.query<IBooking, string>({
      query: (id) => `/bookings/${id}`,
      transformResponse: (response: { data: IBooking }) => response.data,
      providesTags: ['Booking'],
    }),
    cancelBooking: builder.mutation<void, { id: string; reason?: string }>({
      query: ({ id, ...body }) => ({ url: `/bookings/${id}/cancel`, method: 'PATCH', body }),
      invalidatesTags: ['Booking'],
    }),
    getCalendarData: builder.query<unknown, { arenaId: string; date: string }>({
      query: (params) => ({ url: '/bookings/calendar', params }),
      transformResponse: (response: { data: unknown }) => response.data,
      providesTags: ['Booking'],
    }),
  }),
});

export const {
  useGetBookingsQuery,
  useGetBookingByIdQuery,
  useCancelBookingMutation,
  useGetCalendarDataQuery,
} = bookingApi;
