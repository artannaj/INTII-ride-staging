import { API_BASE_URL } from '@/constants/config';
import type {
  AuthResponse,
  AuthUser,
  LoginPayload,
  OtpSentResponse,
  Role,
  SignupPayload,
  VerifyOtpPayload,
} from '@/types/auth';

type ErrorBody = {
  message?: string;
  errors?: Record<string, string>;
};

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  let response: Response;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...((options.headers as Record<string, string>) ?? {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new ApiError(
      'Cannot reach the server. Is the backend running on port 8080?',
      0
    );
  }

  const text = await response.text();
  let data: T | ErrorBody | null = null;
  if (text) {
    try {
      data = JSON.parse(text) as T | ErrorBody;
    } catch {
      throw new ApiError('Unexpected server response', response.status);
    }
  }

  if (!response.ok) {
    const body = data as ErrorBody | null;
    const fieldMessage = body?.errors
      ? Object.values(body.errors).join('\n')
      : undefined;
    throw new ApiError(fieldMessage || body?.message || 'Request failed', response.status);
  }

  return data as T;
}

/* ==========================================================================
   AUTH
   ========================================================================== */

export function signup(payload: SignupPayload): Promise<OtpSentResponse> {
  return request<OtpSentResponse>('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function verifyOtp(payload: VerifyOtpPayload): Promise<AuthResponse> {
  return request<AuthResponse>('/api/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function resendOtp(email: string): Promise<OtpSentResponse> {
  return request<OtpSentResponse>('/api/auth/resend-otp', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export function login(payload: LoginPayload): Promise<AuthResponse> {
  return request<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function forgotPassword(email: string): Promise<{ valid: boolean; message: string }> {
  return request('/api/auth/forgot', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export function verifyResetOtp(email: string, otp: string): Promise<{ valid: boolean; message: string }> {
  return request('/api/auth/verify-reset-otp', {
    method: 'POST',
    body: JSON.stringify({ email, otp }),
  });
}

export function resetPassword(
  email: string,
  otp: string,
  newPassword: string
): Promise<{ valid: boolean; message: string }> {
  return request('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ email, otp, newPassword }),
  });
}

/* ==========================================================================
   PROFILE
   ========================================================================== */

export type Profile = {
  id: number;
  email: string;
  username: string;
  phone: string;
  role: string;
  fullName: string | null;
  faculty: string | null;
  bio: string | null;
  profilePhotoUrl: string | null;
  verifiedStudent: boolean;
  referralCode: string | null;
  language: string;
  twoFactorEnabled: boolean;
  biometricEnabled: boolean;
  status: string;
  balance: number;
  createdAt: string;
  updatedAt: string;
};

export function getProfile(token: string): Promise<Profile> {
  return request<Profile>('/api/profile', {}, token);
}

export function updateProfile(
  token: string,
  payload: {
    fullName?: string;
    phone?: string;
    faculty?: string;
    bio?: string;
    profilePhotoUrl?: string;
  }
): Promise<Profile> {
  return request<Profile>('/api/profile', {
    method: 'PUT',
    body: JSON.stringify(payload),
  }, token);
}

/* ==========================================================================
   SAVED PLACES
   ========================================================================== */

export type Place = {
  id: number;
  label: string;
  address: string;
  icon: string;
};

export function listPlaces(token: string): Promise<Place[]> {
  return request<Place[]>('/api/places', {}, token);
}

export function createPlace(
  token: string,
  payload: { label: string; address: string; icon?: string }
): Promise<Place> {
  return request<Place>('/api/places', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, token);
}

export function updatePlace(
  token: string,
  id: number,
  payload: { label: string; address: string; icon?: string }
): Promise<Place> {
  return request<Place>(`/api/places/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }, token);
}

export function deletePlace(token: string, id: number): Promise<void> {
  return request<void>(`/api/places/${id}`, { method: 'DELETE' }, token);
}

/* ==========================================================================
   PREFERENCES
   ========================================================================== */

export type Preference = {
  quietRide: boolean;
  acOn: boolean;
  musicOk: boolean;
  womenOnly: boolean;
  luggageSpace: boolean;
  petFriendly: boolean;
  notifyRideUpdates: boolean;
  notifyPayments: boolean;
  notifyPromos: boolean;
  notifyReminders: boolean;
};

export function getPreferences(token: string): Promise<Preference> {
  return request<Preference>('/api/preferences', {}, token);
}

export function updatePreferences(
  token: string,
  payload: Partial<Preference>
): Promise<Preference> {
  return request<Preference>('/api/preferences', {
    method: 'PUT',
    body: JSON.stringify(payload),
  }, token);
}

/* ==========================================================================
   SETTINGS
   ========================================================================== */

export type Settings = {
  language: string;
  twoFactorEnabled: boolean;
  biometricEnabled: boolean;
  status: string;
  email: string;
  username: string;
};

export function getSettings(token: string): Promise<Settings> {
  return request<Settings>('/api/settings', {}, token);
}

export function updateSettings(
  token: string,
  payload: { language?: string; twoFactorEnabled?: boolean; biometricEnabled?: boolean }
): Promise<Settings> {
  return request<Settings>('/api/settings', {
    method: 'PUT',
    body: JSON.stringify(payload),
  }, token);
}

export function deleteAccount(token: string): Promise<void> {
  return request<void>('/api/settings/account', { method: 'DELETE' }, token);
}

/* ==========================================================================
   WALLET
   ========================================================================== */

export type Transaction = {
  id: number;
  type: string;
  amount: number;
  description: string;
  status: string;
  reference: string;
  createdAt: string;
};

export type Wallet = {
  balance: number;
  autoTopupEnabled: boolean;
  autoTopupThreshold: number;
  autoTopupAmount: number;
  transactions: Transaction[];
};

export function getWallet(token: string): Promise<Wallet> {
  return request<Wallet>('/api/wallet', {}, token);
}

export function topUpWallet(
  token: string,
  amount: number,
  paymentMethod: string
): Promise<Wallet> {
  return request<Wallet>('/api/wallet/topup', {
    method: 'POST',
    body: JSON.stringify({ amount, paymentMethod }),
  }, token);
}

export function listTransactions(token: string): Promise<Transaction[]> {
  return request<Transaction[]>('/api/wallet/transactions', {}, token);
}

/* ==========================================================================
   PAYMENT METHODS
   ========================================================================== */

export type PaymentMethod = {
  id: number;
  type: string;
  provider: string;
  accountRef: string | null;
  isDefault: boolean;
  expiryDate: string | null;
};

export function listPaymentMethods(token: string): Promise<PaymentMethod[]> {
  return request<PaymentMethod[]>('/api/payment-methods', {}, token);
}

export function createPaymentMethod(
  token: string,
  payload: {
    type: string;
    provider: string;
    accountRef?: string;
    expiryDate?: string;
    isDefault?: boolean;
  }
): Promise<PaymentMethod> {
  return request<PaymentMethod>('/api/payment-methods', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, token);
}

export function updatePaymentMethod(
  token: string,
  id: number,
  payload: {
    type: string;
    provider: string;
    accountRef?: string;
    expiryDate?: string;
    isDefault?: boolean;
  }
): Promise<PaymentMethod> {
  return request<PaymentMethod>(`/api/payment-methods/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }, token);
}

export function deletePaymentMethod(token: string, id: number): Promise<void> {
  return request<void>(`/api/payment-methods/${id}`, { method: 'DELETE' }, token);
}

export function setDefaultPaymentMethod(token: string, id: number): Promise<PaymentMethod> {
  return request<PaymentMethod>(`/api/payment-methods/${id}/default`, {
    method: 'PUT',
  }, token);
}

/* ==========================================================================
   REFERRALS
   ========================================================================== */

export type Referral = {
  id: number;
  referredEmail: string;
  code: string;
  status: string;
  rewardAmount: number;
  createdAt: string;
};

export type ReferralSummary = {
  code: string;
  invitedCount: number;
  completedCount: number;
  totalEarned: number;
  referrals: Referral[];
};

export function getReferrals(token: string): Promise<ReferralSummary> {
  return request<ReferralSummary>('/api/referrals', {}, token);
}

export function generateReferralCode(token: string): Promise<ReferralSummary> {
  return request<ReferralSummary>('/api/referrals/generate', {
    method: 'POST',
  }, token);
}

/* ==========================================================================
   RIDES (Member 3 search + Member 1 driver management)
   ========================================================================== */

export type RideStatus = 'ACTIVE' | 'FULL' | 'IN_PROGRESS' | 'CANCELLED' | 'COMPLETED';

export type Ride = {
  id: number;
  driverId: number;
  driverName: string | null;
  vehicle: string | null;
  origin: string;
  destination: string;
  originLat: number | null;
  originLng: number | null;
  destinationLat: number | null;
  destinationLng: number | null;
  departureTime: string;
  price: number;
  seatsAvailable: number;
  note: string | null;
  status: RideStatus;
  pendingRequests: number | null;
};

export type CreateRidePayload = {
  origin: string;
  destination: string;
  originLat?: number;
  originLng?: number;
  destinationLat?: number;
  destinationLng?: number;
  departureTime: string;
  price: number;
  seatsAvailable: number;
  note?: string;
};

export function searchRides(token: string, origin: string, destination: string): Promise<Ride[]> {
  return request<Ride[]>(`/api/rides/search?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`, {}, token);
}

export function getUpcomingRides(token: string): Promise<Ride[]> {
  return request<Ride[]>('/api/rides/upcoming', {}, token);
}

export function getRide(token: string, rideId: number): Promise<Ride> {
  return request<Ride>(`/api/rides/${rideId}`, {}, token);
}

export function createRide(token: string, payload: CreateRidePayload): Promise<Ride> {
  return request<Ride>('/api/rides', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, token);
}

export function getMyRides(token: string): Promise<Ride[]> {
  return request<Ride[]>('/api/rides/mine', {}, token);
}

export function getRideBookings(token: string, rideId: number): Promise<Booking[]> {
  return request<Booking[]>(`/api/rides/${rideId}/bookings`, {}, token);
}

export function startRide(token: string, rideId: number): Promise<Ride> {
  return request<Ride>(`/api/rides/${rideId}/start`, { method: 'POST' }, token);
}

export function completeRide(token: string, rideId: number): Promise<Ride> {
  return request<Ride>(`/api/rides/${rideId}/complete`, { method: 'POST' }, token);
}

export function cancelRide(token: string, rideId: number): Promise<Ride> {
  return request<Ride>(`/api/rides/${rideId}/cancel`, { method: 'POST' }, token);
}

// ✅ ADDED THIS SO THE DETAILS SCREEN WORKS
export function getRideById(token: string, rideId: number): Promise<Ride> {
  return request<Ride>(`/api/rides/${rideId}`, {}, token);
}

/* ==========================================================================
   LIVE TRACKING
   ========================================================================== */

export type Tracking = {
  rideId: number;
  status: RideStatus;
  driverName: string | null;
  origin: string;
  destination: string;
  originLat: number | null;
  originLng: number | null;
  destinationLat: number | null;
  destinationLng: number | null;
  currentLat: number | null;
  currentLng: number | null;
  secondsSinceUpdate: number | null;
};

export function updateRideLocation(token: string, rideId: number, lat: number, lng: number): Promise<void> {
  return request<void>(`/api/rides/${rideId}/location`, {
    method: 'PUT',
    body: JSON.stringify({ lat, lng }),
  }, token);
}

export function getTracking(token: string, rideId: number): Promise<Tracking> {
  return request<Tracking>(`/api/rides/${rideId}/tracking`, {}, token);
}

/* ==========================================================================
   BOOKINGS
   ========================================================================== */

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED';

export type Booking = {
  id: number;
  rideId: number;
  passengerId: number;
  seatsBooked: number;
  totalPrice: number;
  status: BookingStatus;
  createdAt: string;
  origin: string | null;
  destination: string | null;
  departureTime: string | null;
  rideStatus: RideStatus | null;
  driverId: number | null;
  driverName: string | null;
  vehicle: string | null;
  passengerName: string | null;
  driverPhone: string | null;
  passengerPhone: string | null;
};

export function createBooking(
  token: string,
  payload: { rideId: number; seatsBooked: number }
): Promise<Booking> {
  return request<Booking>('/api/bookings', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, token);
}

export function getMyBookings(token: string): Promise<Booking[]> {
  return request<Booking[]>('/api/bookings/my-bookings', {}, token);
}

export function getBooking(token: string, bookingId: number): Promise<Booking> {
  return request<Booking>(`/api/bookings/${bookingId}`, {}, token);
}

export function cancelBooking(token: string, bookingId: number): Promise<Booking> {
  return request<Booking>(`/api/bookings/${bookingId}/cancel`, { method: 'POST' }, token);
}

export function acceptBooking(token: string, bookingId: number): Promise<Booking> {
  return request<Booking>(`/api/bookings/${bookingId}/accept`, { method: 'POST' }, token);
}

export function rejectBooking(token: string, bookingId: number): Promise<Booking> {
  return request<Booking>(`/api/bookings/${bookingId}/reject`, { method: 'POST' }, token);
}

/* ==========================================================================
   CHAT (driver <-> passenger, one thread per booking)
   ========================================================================== */

export type ChatMessage = {
  id: number;
  bookingId: number;
  senderId: number;
  senderName: string | null;
  mine: boolean;
  message: string;
  createdAt: string;
};

export type Conversation = {
  bookingId: number;
  rideId: number;
  otherName: string | null;
  otherRole: 'DRIVER' | 'PASSENGER';
  origin: string;
  destination: string;
  departureTime: string;
  bookingStatus: BookingStatus;
  lastMessage: string | null;
  lastMessageAt: string | null;
};

export function getConversations(token: string): Promise<Conversation[]> {
  return request<Conversation[]>('/api/bookings/conversations', {}, token);
}

export function getMessages(token: string, bookingId: number, afterId?: number): Promise<ChatMessage[]> {
  const query = afterId ? `?after=${afterId}` : '';
  return request<ChatMessage[]>(`/api/bookings/${bookingId}/messages${query}`, {}, token);
}

export function sendMessage(token: string, bookingId: number, message: string): Promise<ChatMessage> {
  return request<ChatMessage>(`/api/bookings/${bookingId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ message }),
  }, token);
}

/* ==========================================================================
   DRIVER PROFILE & ROLE
   ========================================================================== */

export type DriverProfile = {
  role: Role;
  vehicleModel: string | null;
  vehicleColor: string | null;
  vehiclePlate: string | null;
  complete: boolean;
};

export function getDriverProfile(token: string): Promise<DriverProfile> {
  return request<DriverProfile>('/api/users/driver-profile', {}, token);
}

export function saveDriverProfile(
  token: string,
  payload: { vehicleModel: string; vehicleColor: string; vehiclePlate: string }
): Promise<DriverProfile> {
  return request<DriverProfile>('/api/users/driver-profile', {
    method: 'PUT',
    body: JSON.stringify(payload),
  }, token);
}

export function updateRole(token: string, role: Role): Promise<AuthUser> {
  return request<AuthUser>('/api/users/role', {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  }, token);
}

export function getCurrentUser(token: string): Promise<AuthUser> {
  return request<AuthUser>('/api/auth/me', {}, token);
}