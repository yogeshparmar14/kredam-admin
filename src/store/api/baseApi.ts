import { createApi, fetchBaseQuery, BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import { clearCredentials, setCredentials } from '../slices/authSlice';
import { API_URL } from '../../constants';
import type { RootState } from '../index';

const baseQuery = fetchBaseQuery({
  baseUrl: API_URL,
  credentials: 'include',
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.accessToken;
    if (token) headers.set('Authorization', `Bearer ${token}`);
    return headers;
  },
});

const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  let result = await baseQuery(args, api, extraOptions);

  const url = typeof args === 'string' ? args : args.url;
  if (result.error?.status === 401 && !url.startsWith('/auth/')) {
    const refreshResult = await baseQuery(
      { url: '/auth/refresh-token', method: 'POST' },
      api,
      extraOptions,
    );

    const accessToken = (
      refreshResult.data as { data?: { accessToken?: string } } | undefined
    )?.data?.accessToken;

    if (accessToken) {
      const state = api.getState() as RootState;
      api.dispatch(
        setCredentials({
          accessToken,
          user: state.auth.user!,
          permissions: state.auth.permissions ?? undefined,
          company: state.auth.company,
        }),
      );
      result = await baseQuery(args, api, extraOptions);
    } else {
      api.dispatch(clearCredentials());
    }
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  keepUnusedDataFor: 300,
  refetchOnMountOrArgChange: 120,
  tagTypes: [
    'Auth', 'Arena', 'Sport', 'Court', 'Company',
    'Booking', 'Analytics', 'Report', 'Settings',
    'User', 'BulkBooking', 'Role', 'SlotBlock',
  ],
  endpoints: () => ({}),
});
