import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import api from "@/services/api";

export type UserRole = "admin" | "school" | "teacher" | "parent";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  school_id?: number;
  school?: { id: number; name: string } | null;
  childName?: string; // populated for parent role
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
        // If parent, fetch first child's name for UI
        if (u.role === "parent") {
          try {
            const students = await api.get("/v1/students");
            const first = students.data?.data?.[0] ?? students.data?.[0];
            if (first) u.childName = first.name;
          } catch {}
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

    // Enrich parent with child name
    if (userData.role === "parent") {
      try {
        const students = await api.get("/v1/students");
        const first = students.data?.data?.[0] ?? students.data?.[0];
        if (first) userData.childName = first.name;
      } catch {}
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

