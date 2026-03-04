import { baseApi } from './baseApi';
import type { IApiResponse } from '../../types';

interface DashboardStats {
  todayBookings: number;
  todayRevenue: number;
  monthlyBookings: number;
  monthlyRevenue: number;
  occupancyRate: number;
  pendingPayments: number;
}

export const analyticsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardStats: builder.query<IApiResponse<DashboardStats>, { facilityId?: string }>({
      query: (params) => ({ url: '/analytics/dashboard', params }),
      providesTags: ['Analytics'],
    }),
  }),
});

export const { useGetDashboardStatsQuery } = analyticsApi;
