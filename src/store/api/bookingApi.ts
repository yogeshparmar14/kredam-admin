import { baseApi } from './baseApi';
import type { IBooking, ICalendarData, IPaginatedResponse } from '../../types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function shapeBooking(raw: any): IBooking {
  return {
    id: raw._id ?? raw.id,
    bookingId: raw.bookingId ?? '',
    arena:
      typeof raw.arena === 'object' && raw.arena
        ? raw.arena.name ?? raw.arena._id ?? raw.arena.id ?? ''
        : raw.arena ?? '',
    arenaId:
      typeof raw.arena === 'object' && raw.arena
        ? (raw.arena._id ?? raw.arena.id ?? '')?.toString()
        : raw.arena ?? '',
    court:
      typeof raw.court === 'object' && raw.court
        ? raw.court.name ?? raw.court._id ?? raw.court.id ?? ''
        : raw.court ?? '',
    courtId:
      typeof raw.court === 'object' && raw.court
        ? (raw.court._id ?? raw.court.id ?? '')?.toString()
        : raw.court ?? '',
    customer: raw.customer,
    date: raw.date ? raw.date.slice(0, 10) : '',
    startTime: raw.startTime,
    endTime: raw.endTime,
    duration: raw.duration ?? 0,
    status: raw.status,
    payment: raw.payment ?? {},
    bookingType: raw.bookingType ?? 'regular',
    source: raw.source ?? '',
    createdAt: raw.createdAt,
  };
}

interface GetBookingsParams {
  page?: number;
  limit?: number;
  status?: string;
  arena?: string;
  date?: string;
}

interface CreateBookingBody {
  arenaId: string;
  courtId?: string;
  date: string;
  startTime: string;
  endTime: string;
  customer: { name: string; phone: string; email?: string };
  payment: { mode?: string; total: number; paid?: number; discount?: number };
  bookingType?: string;
  source?: string;
  notes?: string;
}

export const bookingApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getBookings: builder.query<IPaginatedResponse<IBooking[]>, GetBookingsParams>({
      query: (params) => ({ url: '/bookings', params }),
      transformResponse: (response: { data: { data: unknown[]; pagination: IPaginatedResponse<IBooking[]>['pagination'] } }): IPaginatedResponse<IBooking[]> => ({
        data: response.data.data.map(shapeBooking),
        pagination: response.data.pagination,
      }),
      providesTags: ['Booking'],
    }),
    getBookingById: builder.query<IBooking, string>({
      query: (id) => `/bookings/${id}`,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      transformResponse: (response: { data: any }) => shapeBooking(response.data),
      providesTags: ['Booking'],
    }),
    cancelBooking: builder.mutation<void, { id: string; reason?: string }>({
      query: ({ id, ...body }) => ({ url: `/bookings/${id}/cancel`, method: 'PATCH', body }),
      invalidatesTags: ['Booking'],
    }),
    getCalendarData: builder.query<ICalendarData, { arenaId: string; date: string }>({
      query: (params) => ({ url: '/bookings/calendar', params }),
      transformResponse: (response: { data: ICalendarData }) => response.data,
      providesTags: ['Booking'],
    }),
    createBooking: builder.mutation<IBooking, CreateBookingBody>({
      query: (body) => ({ url: '/bookings', method: 'POST', body }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      transformResponse: (response: { data: any }) => shapeBooking(response.data),
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
