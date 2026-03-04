import { baseApi } from './baseApi';
import type { IApiResponse, IBooking, IPaginatedResponse } from '../../types';

interface GetBookingsParams {
  page?: number;
  limit?: number;
  status?: string;
  arenaId?: string;
  date?: string;
}

export const bookingApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getBookings: builder.query<IApiResponse<IPaginatedResponse<IBooking[]>>, GetBookingsParams>({
      query: (params) => ({ url: '/bookings', params }),
      providesTags: ['Booking'],
    }),
    getBookingById: builder.query<IApiResponse<IBooking>, string>({
      query: (id) => `/bookings/${id}`,
      providesTags: ['Booking'],
    }),
    cancelBooking: builder.mutation<IApiResponse<IBooking>, { id: string; reason?: string }>({
      query: ({ id, ...body }) => ({ url: `/bookings/${id}/cancel`, method: 'PATCH', body }),
      invalidatesTags: ['Booking'],
    }),
    getCalendarData: builder.query<IApiResponse<unknown>, { arenaId: string; date: string }>({
      query: (params) => ({ url: '/bookings/calendar', params }),
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
