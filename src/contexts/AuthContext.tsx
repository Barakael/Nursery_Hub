import { createContext, useContext, useState, ReactNode } from "react";

export type UserRole = "admin" | "school" | "teacher" | "parent";

interface AuthUser {
  id: string;
  name: string;
  role: UserRole;
  avatar?: string;
  childName?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (role: UserRole) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const mockUsers: Record<UserRole, AuthUser> = {
  admin: { id: "1", name: "Admin User", role: "admin" },
  school: { id: "2", name: "School Manager", role: "school" },
  teacher: { id: "3", name: "Ms. Sarah", role: "teacher" },
  parent: { id: "4", name: "John Doe", role: "parent", childName: "Emma Doe" },
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);

  const login = (role: UserRole) => setUser(mockUsers[role]);
  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
