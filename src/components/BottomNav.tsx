import { Home, BookOpen, CreditCard, Calendar, User, Users, BarChart3, Settings } from "lucide-react";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { Link, useLocation } from "react-router-dom";

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
    { icon: BookOpen, label: "Scores", path: "/scores" },
    { icon: Calendar, label: "Timetable", path: "/timetable" },
    { icon: User, label: "Profile", path: "/profile" },
  ],
  admin: [
    { icon: Home, label: "Home", path: "/dashboard" },
    { icon: Users, label: "Users", path: "/users" },
    { icon: CreditCard, label: "Finance", path: "/payments" },
    { icon: BarChart3, label: "Reports", path: "/reports" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ],
  school: [
    { icon: Home, label: "Home", path: "/dashboard" },
    { icon: Users, label: "Students", path: "/students" },
    { icon: BookOpen, label: "Classes", path: "/classes" },
    { icon: Calendar, label: "Timetable", path: "/timetable" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ],
};

const BottomNav = () => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const items = navItems[user.role];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card safe-bottom">
      <div className="mx-auto flex max-w-lg items-center justify-around px-2 py-1">
        {items.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
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
      </div>
    </nav>
  );
};

export default BottomNav;
