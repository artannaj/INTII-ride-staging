import type { BookingStatus, RideStatus } from '@/lib/api';

type StatusStyle = { label: string; color: string; bg: string };

export const BOOKING_STATUS: Record<BookingStatus, StatusStyle> = {
  PENDING: { label: 'Pending', color: '#B45309', bg: '#FEF3C7' },
  CONFIRMED: { label: 'Confirmed', color: '#15803D', bg: '#DCFCE7' },
  REJECTED: { label: 'Declined', color: '#6B7280', bg: '#F3F4F6' },
  COMPLETED: { label: 'Completed', color: '#1D4ED8', bg: '#DBEAFE' },
  CANCELLED: { label: 'Cancelled', color: '#6B7280', bg: '#F3F4F6' },
};

export const RIDE_STATUS: Record<RideStatus, StatusStyle> = {
  ACTIVE: { label: 'Open', color: '#15803D', bg: '#DCFCE7' },
  FULL: { label: 'Full', color: '#B45309', bg: '#FEF3C7' },
  IN_PROGRESS: { label: 'On the way', color: '#FFFFFF', bg: '#E30611' },
  COMPLETED: { label: 'Completed', color: '#1D4ED8', bg: '#DBEAFE' },
  CANCELLED: { label: 'Cancelled', color: '#6B7280', bg: '#F3F4F6' },
};

/** Backend sends LocalDateTime without an offset; JS parses that as local time. */
export function formatTime(iso: string | null | undefined): string {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function formatDay(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
  return d.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' });
}
