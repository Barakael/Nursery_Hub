import { Home, BookOpen, CreditCard, Calendar, User, Users, BarChart3, Settings, FileBarChart, FileClock, Menu, X } from "lucide-react";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { Link, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
}

const navItems: Record<UserRole, NavItem[]> = {
  parent: [
    { icon: Home, label: "Home", path: "/dashboard" },
    { icon: BarChart3, label: "Grades", path: "/performance" },
    { icon: CreditCard, label: "Payments", path: "/payments" },
    { icon: Calendar, label: "Timetable", path: "/timetable" },
    { icon: User, label: "Profile", path: "/profile" },
  ],
  teacher: [
    { icon: Home, label: "Home", path: "/dashboard" },
    { icon: Users, label: "Students", path: "/students" },
    { icon: Calendar, label: "Timetable", path: "/timetable" },
    { icon: User, label: "Profile", path: "/profile" },
  ],
  admin: [
    { icon: Home, label: "Home", path: "/dashboard" },
    { icon: Users, label: "Users", path: "/users" },
    { icon: BarChart3, label: "Academics", path: "/dashboard?tab=academics" },
    { icon: CreditCard, label: "Finance", path: "/payments" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ],
  school: [
    { icon: Home, label: "Home", path: "/dashboard" },
    { icon: Users, label: "Students", path: "/students" },
    { icon: BarChart3, label: "Academics", path: "/dashboard?tab=academics" },
    { icon: CreditCard, label: "Finance", path: "/payments" },
  ],
};

const schoolMoreItems = [
  { icon: Calendar, label: "Timetable", path: "/timetable" },
  { icon: User, label: "Staffs & Parents", path: "/users" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

const BottomNav = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMoreOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!moreOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [moreOpen]);

  if (!user) return null;

  const baseItems = navItems[user.role] ?? navItems.admin;
  const showMore = user.role === "school";
  const isMoreActive = schoolMoreItems.some((i) =>
    i.path.includes("?")
      ? location.pathname + location.search === i.path
      : location.pathname === i.path && !location.search
  );

  return (
    <>
      {/* More dropup for school role */}
      {showMore && moreOpen && (
        <div
          ref={menuRef}
          className="fixed bottom-[68px] right-3 z-50 flex flex-col gap-1 rounded-2xl bg-card border border-border shadow-elevated p-2 min-w-[180px] animate-fade-in"
        >
          {schoolMoreItems.map((item) => {
            const isActive = item.path.includes("?")
              ? location.pathname + location.search === item.path
              : location.pathname === item.path && !location.search;
            return (
              <Link
                key={item.label}
                to={item.path}
                className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-foreground hover:bg-accent"
                }`}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card safe-bottom">
        <div className="mx-auto flex max-w-lg items-center justify-around px-2 py-1">
          {baseItems.map((item) => {
            const isActive = item.path.includes("?")
              ? location.pathname + location.search === item.path
              : location.pathname === item.path && !location.search;
            return (
              <Link
                key={item.label}
                to={item.path}
                className={`flex flex-col items-center gap-0.5 rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <item.icon className={`h-5 w-5 ${isActive ? "text-primary" : ""}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}

          {/* Hamburger toggle for school role */}
          {showMore && (
            <button
              onClick={() => setMoreOpen((v) => !v)}
              className={`flex flex-col items-center gap-0.5 rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
                isMoreActive && !moreOpen
                  ? "text-primary"
                  : moreOpen
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {moreOpen
                ? <X className="h-5 w-5" />
                : <Menu className={`h-5 w-5 ${isMoreActive ? "text-primary" : ""}`} />
              }
              <span>More</span>
            </button>
          )}
        </div>
      </nav>
    </>
  );
};

export default BottomNav;

