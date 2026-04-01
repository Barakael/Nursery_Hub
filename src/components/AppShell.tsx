import { ReactNode } from "react";
import BottomNav from "./BottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut } from "lucide-react";

const AppShell = ({ children }: { children: ReactNode }) => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {user && (
        <header className="sticky top-0 z-40 bg-primary px-4 py-3">
          <div className="mx-auto flex max-w-lg items-center justify-between">
            <div>
              <p className="text-sm font-medium text-primary-foreground/70">
                {user.role === "parent" ? `👋 Welcome back,` : `Hello,`}
              </p>
              <h1 className="text-lg font-bold text-primary-foreground">{user.name}</h1>
            </div>
            <button
              onClick={logout}
              className="rounded-xl bg-primary-foreground/10 p-2 text-primary-foreground transition-colors hover:bg-primary-foreground/20"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </header>
      )}
      <main className="mx-auto max-w-lg px-4 pb-24 pt-4">{children}</main>
      <BottomNav />
    </div>
  );
};

export default AppShell;
