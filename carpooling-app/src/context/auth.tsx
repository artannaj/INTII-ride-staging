import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { router } from 'expo-router'; // <-- ADDED IMPORT

import * as api from '@/lib/api';
import { authenticate } from '@/lib/biometrics';
import {
  getBiometricSession,
  getStoredToken,
  getStoredUserJson,
  setBiometricSession,
  setStoredToken,
  setStoredUserJson,
} from '@/lib/storage';
import type {
  AuthResponse,
  AuthUser,
  LoginPayload,
  OtpSentResponse,
  Role,
  SignupPayload,
  VerifyOtpPayload,
} from '@/types/auth';

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  biometricLoginEnabled: boolean;
  biometricEmail: string | null;
  signIn: (payload: LoginPayload) => Promise<void>;
  signInWithBiometrics: () => Promise<void>;
  enableBiometricLogin: () => Promise<boolean>;
  disableBiometricLogin: () => Promise<void>;
  requestSignup: (payload: SignupPayload) => Promise<OtpSentResponse>;
  verifySignupOtp: (payload: VerifyOtpPayload) => Promise<void>;
  resendSignupOtp: (email: string) => Promise<OtpSentResponse>;
  setRole: (role: Role) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function toUser(response: AuthResponse | AuthUser): AuthUser {
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
  const [biometricEmail, setBiometricEmail] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const [storedToken, storedUser, bioSession] = await Promise.all([
          getStoredToken(),
          getStoredUserJson(),
          getBiometricSession(),
        ]);
        
        if (!active) return;

        // 🛠️ GHOST SESSION FIX: If token exists but user data is missing, wipe it
        if (storedToken && !storedUser) {
          await setStoredToken(null);
          setToken(null);
          setUser(null);
        } else {
          setToken(storedToken);
          setUser(storedUser ? (JSON.parse(storedUser) as AuthUser) : null);
        }
        
        setBiometricEmail(bioSession ? (JSON.parse(bioSession.userJson) as AuthUser).email : null);
      } finally {
        if (active) setIsLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const saveSession = useCallback(async (nextToken: string, nextUser: AuthUser) => {
    await Promise.all([
      setStoredToken(nextToken),
      setStoredUserJson(JSON.stringify(nextUser)),
    ]);
    setToken(nextToken);
    setUser(nextUser);
  }, []);

  const persistSession = useCallback(
    async (response: AuthResponse) => {
      const nextUser = toUser(response);
      await saveSession(response.token, nextUser);

      const bio = await getBiometricSession();
      if (bio) {
        const bioUser = JSON.parse(bio.userJson) as AuthUser;
        if (bioUser.email === nextUser.email) {
          await setBiometricSession({ token: response.token, userJson: JSON.stringify(nextUser) });
        } else {
          await setBiometricSession(null);
          setBiometricEmail(null);
        }
      }
    },
    [saveSession]
  );

  const signIn = useCallback(
    async (payload: LoginPayload) => {
      const response = await api.login(payload);
      await persistSession(response);
    },
    [persistSession]
  );

  const signInWithBiometrics = useCallback(async () => {
    const bio = await getBiometricSession();
    if (!bio) {
      throw new Error('Biometric login is not set up on this device.');
    }
    const ok = await authenticate('Log in to INTI Ride');
    if (!ok) {
      throw new Error('Biometric check was cancelled or not recognised.');
    }

    let current: AuthUser;
    try {
      current = await api.getCurrentUser(bio.token);
    } catch (err) {
      if (err instanceof api.ApiError && (err.status === 401 || err.status === 403)) {
        await setBiometricSession(null);
        setBiometricEmail(null);
        throw new Error('Your saved session has expired. Log in with your password, then turn biometric login back on in Settings.');
      }
      throw err;
    }

    const nextUser = toUser(current);
    await setBiometricSession({ token: bio.token, userJson: JSON.stringify(nextUser) });
    await saveSession(bio.token, nextUser);
  }, [saveSession]);

  const enableBiometricLogin = useCallback(async () => {
    if (!token || !user) return false;
    const ok = await authenticate('Confirm to turn on biometric login');
    if (!ok) return false;

    await setBiometricSession({ token, userJson: JSON.stringify(user) });
    setBiometricEmail(user.email);
    api.updateSettings(token, { biometricEnabled: true }).catch(() => {});
    return true;
  }, [token, user]);

  const disableBiometricLogin = useCallback(async () => {
    await setBiometricSession(null);
    setBiometricEmail(null);
    if (token) {
      api.updateSettings(token, { biometricEnabled: false }).catch(() => {});
    }
  }, [token]);

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

  const setRole = useCallback(
    async (role: Role) => {
      if (!token) return;
      const updated = await api.updateRole(token, role);
      await saveSession(token, toUser(updated));
    },
    [token, saveSession]
  );

  const signOut = useCallback(async () => {
    await Promise.all([setStoredToken(null), setStoredUserJson(null)]);
    setToken(null);
    setUser(null);
    
    // 🛠️ THE FIX: Force redirect to login so you never get stuck on the Home screen
    router.replace('/login');
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      isLoading,
      biometricLoginEnabled: biometricEmail !== null,
      biometricEmail,
      signIn,
      signInWithBiometrics,
      enableBiometricLogin,
      disableBiometricLogin,
      requestSignup,
      verifySignupOtp,
      resendSignupOtp,
      setRole,
      signOut,
    }),
    [
      user,
      token,
      isLoading,
      biometricEmail,
      signIn,
      signInWithBiometrics,
      enableBiometricLogin,
      disableBiometricLogin,
      requestSignup,
      verifySignupOtp,
      resendSignupOtp,
      setRole,
      signOut,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}