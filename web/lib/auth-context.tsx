"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

interface KamInfo {
  id: string;
  name: string;
  email: string;
}

interface AuthState {
  token: string | null;
  kam: KamInfo | null;
  status: "loading" | "authenticated" | "unauthenticated";
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

const TOKEN_KEY = "xepelin_token";
const KAM_KEY = "xepelin_kam";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [kam, setKam] = useState<KamInfo | null>(null);
  const [status, setStatus] = useState<"loading" | "authenticated" | "unauthenticated">("loading");

  useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_KEY);
    const savedKam = localStorage.getItem(KAM_KEY);
    if (savedToken && savedKam) {
      setToken(savedToken);
      setKam(JSON.parse(savedKam));
      setStatus("authenticated");
    } else {
      setStatus("unauthenticated");
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    const res = await fetch(`${apiUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message || "Credenciales inválidas");
    }

    const data = await res.json();
    setToken(data.access_token);
    setKam(data.kam);
    setStatus("authenticated");
    localStorage.setItem(TOKEN_KEY, data.access_token);
    localStorage.setItem(KAM_KEY, JSON.stringify(data.kam));
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setKam(null);
    setStatus("unauthenticated");
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(KAM_KEY);
  }, []);

  return (
    <AuthContext.Provider value={{ token, kam, status, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
