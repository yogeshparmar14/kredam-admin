import { baseApi } from './baseApi';
import type { IBooking, ICalendarData, IPaginatedResponse } from '../../types';

interface GetBookingsParams {
  page?: number;
  limit?: number;
  status?: string;
  arenaId?: string;
  date?: string;
}

interface CreateBookingBody {
  arenaId: string;
  courtId: string;
  date: string;
  startTime: string;
  endTime: string;
  customer: { name: string; phone: string; email?: string };
  payment: { mode: string; total: number; paid?: number };
  bookingType?: string;
  source?: string;
  notes?: string;
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
    getCalendarData: builder.query<ICalendarData, { facilityId: string; date: string }>({
      query: (params) => ({ url: '/bookings/calendar', params }),
      transformResponse: (response: { data: ICalendarData }) => response.data,
      providesTags: ['Booking'],
    }),
    createBooking: builder.mutation<IBooking, CreateBookingBody>({
      query: (body) => ({ url: '/bookings', method: 'POST', body }),
      transformResponse: (response: { data: IBooking }) => response.data,
      invalidatesTags: ['Booking'],
    }),
  }),
});

export const {
  useGetBookingsQuery,
  useGetBookingByIdQuery,
  useCancelBookingMutation,
  useGetCalendarDataQuery,
  useCreateBookingMutation,
} = bookingApi;
