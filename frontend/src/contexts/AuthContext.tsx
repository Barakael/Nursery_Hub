import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import api from "@/services/api";

export type UserRole = "admin" | "school" | "teacher" | "parent" | "stockkeeper";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  school_id?: number;
  school?: { id: number; name: string } | null;
  children?: { id: number; name: string; class_id?: number; class_name?: string }[]; // populated for parent role
  childNames?: string[]; // derived from children
  can_manage_timetable?: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (u: AuthUser) => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    const token = localStorage.getItem("nursery_token");
    if (!token) {
      setIsLoading(false);
      return;
    }
    api
      .get("/v1/auth/me")
      .then(async (res) => {
        // Laravel wraps standalone resources in { data: { ... } }
        const u: AuthUser = res.data?.data ?? res.data;
        // Derive childNames from children returned by the API
        if (u.role === "parent" && u.children) {
          u.childNames = u.children.map((c) => c.name).filter(Boolean);
        }
        setUser(u);
      })
      .catch(() => {
        localStorage.removeItem("nursery_token");
        localStorage.removeItem("nursery_user");
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post("/v1/auth/login", { email, password });
    const { token, user: userData } = res.data as { token: string; user: AuthUser };

    localStorage.setItem("nursery_token", token);
    localStorage.setItem("nursery_user", JSON.stringify(userData));

    // Derive childNames from children returned by the login response
    if (userData.role === "parent" && userData.children) {
      userData.childNames = userData.children.map((c) => c.name).filter(Boolean);
    }

    setUser(userData);
  };

  const logout = () => {
    api.post("/v1/auth/logout").catch(() => {});
    localStorage.removeItem("nursery_token");
    localStorage.removeItem("nursery_user");
    setUser(null);
  };

  const updateUser = (u: AuthUser) => setUser(u);

  return (
    <AuthContext.Provider
      value={{ user, login, logout, updateUser, isAuthenticated: !!user, isLoading }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

