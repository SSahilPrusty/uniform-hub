import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "../services/api";

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: "CUSTOMER" | "SCHOOL_ADMIN" | "FRANCHISE_ADMIN" | "TAILOR" | "ADMIN" | "SUPER_ADMIN";
  unreadNotificationsCount?: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: any) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  switchDemoUser: (role: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem("uh_token"));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    try {
      const storedToken = localStorage.getItem("uh_token");
      if (!storedToken) {
        setUser(null);
        setIsLoading(false);
        return;
      }
      const res = await api.get("/auth/me");
      if (res.data.success) {
        setUser(res.data.data);
      } else {
        setUser(null);
      }
    } catch {
      localStorage.removeItem("uh_token");
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await api.post("/auth/login", { email, password });
      if (res.data.success) {
        const { user: userData, token: jwtToken } = res.data.data;
        localStorage.setItem("uh_token", jwtToken);
        setToken(jwtToken);
        setUser(userData);
        return { success: true };
      }
      return { success: false, error: res.data.error || "Login failed" };
    } catch (err: any) {
      return {
        success: false,
        error: err.response?.data?.error || "Invalid credentials. Please try again.",
      };
    }
  };

  const register = async (data: any) => {
    try {
      const res = await api.post("/auth/register", data);
      if (res.data.success) {
        const { user: userData, token: jwtToken } = res.data.data;
        localStorage.setItem("uh_token", jwtToken);
        setToken(jwtToken);
        setUser(userData);
        return { success: true };
      }
      return { success: false, error: res.data.error || "Registration failed" };
    } catch (err: any) {
      return {
        success: false,
        error: err.response?.data?.error || "Registration failed. Please check inputs.",
      };
    }
  };

  const logout = () => {
    localStorage.removeItem("uh_token");
    setToken(null);
    setUser(null);
    window.location.href = "/";
  };

  const switchDemoUser = async (role: string) => {
    const demoAccounts: Record<string, { email: string; pass: string }> = {
      SUPER_ADMIN: { email: "superadmin@uniformhub.in", pass: "SuperAdmin@123" },
      ADMIN: { email: "admin@uniformhub.in", pass: "Admin@123" },
      SCHOOL_ADMIN: { email: "dps.principal@uniformhub.in", pass: "School@123" },
      FRANCHISE_ADMIN: { email: "franchise.delhi@uniformhub.in", pass: "Franchise@123" },
      TAILOR: { email: "master.tailor@uniformhub.in", pass: "Tailor@123" },
      CUSTOMER: { email: "parent.rahul@uniformhub.in", pass: "Customer@123" },
    };

    const target = demoAccounts[role];
    if (target) {
      await login(target.email, target.pass);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
        switchDemoUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
