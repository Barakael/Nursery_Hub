import { Home, BookOpen, CreditCard, Calendar, User, Users, BarChart3, Settings, GraduationCap, FileBarChart } from "lucide-react";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { Link, useLocation } from "react-router-dom";

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
}

const navItems: Record<UserRole, NavItem[]> = {
  parent: [
    { icon: Home, label: "Dashboard", path: "/dashboard" },
    { icon: BarChart3, label: "Grades", path: "/performance" },
    { icon: CreditCard, label: "Payments", path: "/payments" },
    { icon: Calendar, label: "Timetable", path: "/timetable" },
    { icon: User, label: "Profile", path: "/profile" },
  ],
  teacher: [
    { icon: Home, label: "Dashboard", path: "/dashboard" },
    { icon: Users, label: "Students", path: "/students" },
    { icon: BookOpen, label: "Scores", path: "/scores" },
    { icon: User, label: "Profile", path: "/profile" },
  ],
  admin: [
    { icon: Home, label: "Dashboard", path: "/dashboard" },
    { icon: Users, label: "Users", path: "/users" },
    { icon: BookOpen, label: "Subjects", path: "/subjects" },
    { icon: CreditCard, label: "Finance", path: "/payments" },
    { icon: BarChart3, label: "Reports", path: "/reports" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ],
  school: [
    { icon: Home, label: "Dashboard", path: "/dashboard" },
    { icon: Users, label: "Students", path: "/students" },
    { icon: BookOpen, label: "Subjects", path: "/subjects" },
    { icon: CreditCard, label: "Finance", path: "/payments" },
    { icon: Calendar, label: "Timetable", path: "/timetable" },
    { icon: User, label: "Staffs", path: "/users" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ],
};

const SidebarNav = () => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const baseItems = navItems[user.role] ?? navItems.admin;
  const items = user.role === "teacher" && user.can_manage_timetable
    ? [...baseItems.slice(0, -1), { icon: Calendar, label: "Timetable", path: "/timetable" }, baseItems[baseItems.length - 1]]
    : baseItems;

  return (
    <div className="flex h-full flex-col bg-sidebar border-r border-sidebar-border">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-sidebar-border">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sidebar-accent">
          <GraduationCap className="h-6 w-6 text-sidebar-accent-foreground" />
        </div>
        <div>
          <h2 className="text-base font-extrabold text-sidebar-foreground">NurseryHub</h2>
          <p className="text-xs text-sidebar-foreground/50">School Management</p>
        </div>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {items.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User info */}
      <div className="border-t border-sidebar-border px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sidebar-accent text-sm">
            👤
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-sidebar-foreground">{user.name}</p>
            <p className="text-xs text-sidebar-foreground/50 capitalize">{user.role}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SidebarNav;
