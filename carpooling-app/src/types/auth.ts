export type Role = 'DRIVER' | 'PASSENGER';

export type AuthUser = {
  email: string;
  username: string;
  phone?: string;
  role: Role;
};

export type AuthResponse = AuthUser & {
  token: string;
};

export type SignupPayload = {
  email: string;
  username: string;
  password: string;
  phone: string;
  role: Role;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type OtpSentResponse = {
  email: string;
  message: string;
};

export type VerifyOtpPayload = {
  email: string;
  otp: string;
};
