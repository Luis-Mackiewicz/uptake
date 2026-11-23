"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  ApiRequestError,
  api,
  getToken,
  setToken,
  TOKEN_EVENT,
  UNAUTHORIZED_EVENT,
} from "@/lib/api/client";
import type {
  LoginRequest,
  RegisterRequest,
  UpdateProfileRequest,
  User,
} from "@/lib/api/types";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  updateProfile: (data: UpdateProfileRequest) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function subscribe(onStoreChange: () => void) {
  window.addEventListener(TOKEN_EVENT, onStoreChange);
  window.addEventListener(UNAUTHORIZED_EVENT, onStoreChange);
  return () => {
    window.removeEventListener(TOKEN_EVENT, onStoreChange);
    window.removeEventListener(UNAUTHORIZED_EVENT, onStoreChange);
  };
}

function getClientSnapshot() {
  return getToken();
}

function getServerSnapshot() {
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const token = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
  const [user, setUser] = useState<User | null>(null);
  const [checkedToken, setCheckedToken] = useState<string | null | undefined>(undefined);

  const applyToken = useCallback((value: string | null) => {
    setToken(value);
  }, []);

  useEffect(() => {
    if (token === checkedToken) return;

    let active = true;
    const load = async () => {
      await Promise.resolve();
      if (!token) {
        if (active) setCheckedToken(null);
        return;
      }

      try {
        const currentUser = await api.get<User>("/auth/me");
        if (active) setUser(currentUser);
      } catch (error) {
        if (!active) return;
        if (error instanceof ApiRequestError && error.status === 401) applyToken(null);
        setUser(null);
      } finally {
        if (active) setCheckedToken(token);
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [token, checkedToken, applyToken]);

  useEffect(() => {
    const handleUnauthorized = () => {
      setCheckedToken(null);
      setUser(null);
    };

    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
  }, []);

  const login = useCallback(
    async (data: LoginRequest) => {
      const response = await api.post<{ token: string }>("/auth/login", data);
      applyToken(response.token);
      try {
        const currentUser = await api.get<User>("/auth/me");
        setUser(currentUser);
        setCheckedToken(response.token);
      } catch (error) {
        applyToken(null);
        setCheckedToken(null);
        setUser(null);
        throw error;
      }
    },
    [applyToken],
  );

  const register = useCallback(async (data: RegisterRequest) => {
    await api.post<User>("/auth/register", data);
  }, []);

  const updateProfile = useCallback(async (data: UpdateProfileRequest) => {
    const currentUser = await api.patch<User>("/auth/me", data);
    setUser(currentUser);
  }, []);

  const logout = useCallback(() => {
    applyToken(null);
    setCheckedToken(null);
    setUser(null);
    router.replace("/login");
  }, [applyToken, router]);

  const refresh = useCallback(async () => {
    setUser(null);
    setCheckedToken(null);
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const loading = checkedToken !== token;
    return {
      user,
      token,
      loading,
      isAuthenticated: Boolean(token && user && checkedToken === token),
      login,
      register,
      updateProfile,
      logout,
      refresh,
    };
  }, [user, token, checkedToken, login, register, updateProfile, logout, refresh]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
