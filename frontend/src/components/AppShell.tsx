import { ReactNode } from "react";
import BottomNav from "./BottomNav";
import SidebarNav from "./SidebarNav";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut } from "lucide-react";

const AppShell = ({ children }: { children: ReactNode }) => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar — fixed, full height */}
      <div className="hidden md:fixed md:inset-y-0 md:left-0 md:z-50 md:flex md:w-64 md:flex-col">
        <SidebarNav />
      </div>

      {/* Mobile header */}
      {user && (
        <header className="sticky top-0 z-40 bg-primary px-4 py-2 md:hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-primary-foreground/70">
                {user.role === "parent" ? "👋 Welcome back," : "Hello,"}
              </p>
              <h1 className="text-base font-bold text-primary-foreground">{user.name}</h1>
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

      {/* Desktop header — offset by sidebar width */}
      {user && (
        <header className="hidden md:flex md:ml-64 sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-sm px-8 py-2 items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              {user.role === "parent" ? "👋 Welcome back," : "Hello,"}
            </p>
            <h1 className="text-xl font-bold text-foreground">{user.name}</h1>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 rounded-xl bg-muted px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </header>
      )}

      {/* Main content — mobile: full width with bottom padding for nav */}
      {/*                desktop: offset left by sidebar, full remaining width */}
      <main className="px-4 pb-24 pt-4 md:ml-64 md:px-8 md:pb-10 md:pt-6">
        <div className="mx-auto max-w-screen-xl">
          {children}
        </div>
      </main>

      {/* Mobile bottom nav */}
      <div className="md:hidden">
        <BottomNav />
      </div>
    </div>
  );
};

export default AppShell;
