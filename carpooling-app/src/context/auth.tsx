import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

import * as api from '@/lib/api';
import {
  getStoredToken,
  getStoredUserJson,
  setStoredToken,
  setStoredUserJson,
} from '@/lib/storage';
import type {
  AuthResponse,
  AuthUser,
  LoginPayload,
  OtpSentResponse,
  SignupPayload,
  VerifyOtpPayload,
} from '@/types/auth';

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  signIn: (payload: LoginPayload) => Promise<void>;
  requestSignup: (payload: SignupPayload) => Promise<OtpSentResponse>;
  verifySignupOtp: (payload: VerifyOtpPayload) => Promise<void>;
  resendSignupOtp: (email: string) => Promise<OtpSentResponse>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function toUser(response: AuthResponse): AuthUser {
  return {
    email: response.email,
    username: response.username,
    phone: response.phone,
    role: response.role,
  };
}

export function useAuth() {
  const value = use(AuthContext);
  if (!value) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return value;
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const [storedToken, storedUser] = await Promise.all([
          getStoredToken(),
          getStoredUserJson(),
        ]);
        if (!active) return;
        setToken(storedToken);
        setUser(storedUser ? (JSON.parse(storedUser) as AuthUser) : null);
      } finally {
        if (active) setIsLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const persistSession = useCallback(async (response: AuthResponse) => {
    const nextUser = toUser(response);
    await Promise.all([
      setStoredToken(response.token),
      setStoredUserJson(JSON.stringify(nextUser)),
    ]);
    setToken(response.token);
    setUser(nextUser);
  }, []);

  const signIn = useCallback(
    async (payload: LoginPayload) => {
      const response = await api.login(payload);
      await persistSession(response);
    },
    [persistSession]
  );

  const requestSignup = useCallback(async (payload: SignupPayload) => {
    return api.signup(payload);
  }, []);

  const verifySignupOtp = useCallback(
    async (payload: VerifyOtpPayload) => {
      const response = await api.verifyOtp(payload);
      await persistSession(response);
    },
    [persistSession]
  );

  const resendSignupOtp = useCallback(async (email: string) => {
    return api.resendOtp(email);
  }, []);

  const signOut = useCallback(async () => {
    await Promise.all([setStoredToken(null), setStoredUserJson(null)]);
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      isLoading,
      signIn,
      requestSignup,
      verifySignupOtp,
      resendSignupOtp,
      signOut,
    }),
    [user, token, isLoading, signIn, requestSignup, verifySignupOtp, resendSignupOtp, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
