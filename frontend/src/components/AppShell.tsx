import { ReactNode } from "react";
import BottomNav from "./BottomNav";
import SidebarNav from "./SidebarNav";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut, GraduationCap } from "lucide-react";

const AppShell = ({ children }: { children: ReactNode }) => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <div className="hidden md:fixed md:inset-y-0 md:left-0 md:z-50 md:flex md:w-64 md:flex-col">
        <SidebarNav />
      </div>

      {/* Mobile header */}
      {user && (
        <header className="sticky top-0 z-40 bg-primary px-4 py-3 md:hidden">
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

      {/* Desktop header */}
      {user && (
        <header className="hidden md:block md:ml-64 sticky top-0 z-40 border-b border-border bg-card px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                {user.role === "parent" ? `👋 Welcome back,` : `Hello,`}
              </p>
              <h1 className="text-lg font-bold text-foreground">{user.name}</h1>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 rounded-xl bg-muted px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </header>
      )}

      {/* Content */}
      <main className="mx-auto max-w-lg px-4 pb-24 pt-4 md:max-w-4xl md:ml-64 md:pb-8 md:px-8 md:pt-6">
        {children}
      </main>

      {/* Mobile bottom nav */}
      <div className="md:hidden">
        <BottomNav />
      </div>
    </div>
  );
};

export default AppShell;
