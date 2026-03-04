export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  [key: string]: unknown;
}

export interface CompanyContext {
  id: string;
  name: string;
  code: string;
}

export interface ModulePermissions {
  view: boolean;
  create: boolean;
  update: boolean;
  delete: boolean;
}

export interface SidebarItem {
  key: string;
  icon: string;
  label: string;
  route: string;
  module: string;
}

export interface RolePermissions {
  sidebarItems: SidebarItem[];
  modules: Record<string, ModulePermissions>;
  allowedRoutes: string[];
  roleDisplayName: string;
}

export interface IRole {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  permissions: Record<string, ModulePermissions>;
  isSystem: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface IArena {
  id: string;
  name: string;
  code: string;
  address?: { street?: string; city?: string; state?: string };
  operatingHours?: { open: string; close: string };
  latitude?: number;
  longitude?: number;
  isActive: boolean;
}

export type DayType =
  | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday'
  | 'saturday' | 'sunday' | 'weekday' | 'weekend' | 'all';

export interface ICourtPricingRule {
  dayType: DayType;
  startTime: string;
  endTime: string;
  price: number;
}

export interface ICourt {
  id: string;
  name: string;
  arena: string;
  sport?: string;
  defaultPrice: number;
  pricing: ICourtPricingRule[];
  isActive: boolean;
}

export interface ISport {
  id: string;
  name: string;
  arena: string;
  slotDuration: number;
  defaultPrice: number;
  isActive: boolean;
  company?: string;
}

export interface IUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export interface IBooking {
  id: string;
  bookingId: string;
  arena: string;
  arenaId: string;
  court: string;
  courtId: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show' | 'rescheduled';
  customer: { name: string; phone: string; email?: string };
  payment: { total: number; paid: number; due: number; mode?: string };
  bookingType: string;
  source: string;
  createdAt: string;
}

export interface ISlotBlock {
  id: string;
  arena: string;
  court?: string;
  sport?: string;
  date: string;
  startTime: string;
  endTime: string;
  reason: string;
  isReleased: boolean;
  createdBy?: string;
  createdAt: string;
}

export interface IPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface IApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
}

export interface IPaginatedResponse<T> {
  data: T;
  pagination: IPagination;
}

export interface ICalendarCourtSport {
  id: string;
  name: string;
  slotDuration: number;
  defaultPrice: number;
}

export interface ICalendarCourt {
  id: string;
  name: string;
  sport: ICalendarCourtSport;
  defaultPrice: number;
  pricing: ICourtPricingRule[];
}

export interface ICalendarBooking {
  id: string;
  bookingId: string;
  courtId: string;
  customerName: string;
  bookingType: string;
  startTime: string;
  endTime: string;
  status: string;
}

export interface ICalendarBlock {
  id: string;
  courtId: string;
  startTime: string;
  endTime: string;
  reason: string;
}

export interface ICalendarData {
  date: string;
  facilityId: string;
  operatingHours: { open: string; close: string };
  courts: ICalendarCourt[];
  bookings: ICalendarBooking[];
  blocks: ICalendarBlock[];
  stats: {
    totalBookings: number;
    revenue: number;
    occupancyPercent: number;
  };
}

export interface ISelectedSlot {
  courtId: string;
  courtName: string;
  startTime: string;
  endTime: string;
  price: number;
}
