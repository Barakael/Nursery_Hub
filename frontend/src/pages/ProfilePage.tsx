import { useAuth } from "@/contexts/AuthContext";
import { User, Mail, Phone, School, LogOut } from "lucide-react";

const ProfilePage = () => {
  const { user, logout } = useAuth();

  if (!user) return null;

  const info = [
    { icon: User, label: "Name", value: user.name },
    { icon: Mail, label: "Email", value: `${user.name.toLowerCase().replace(" ", ".")}@email.com` },
    { icon: Phone, label: "Phone", value: "+234 801 234 5678" },
    { icon: School, label: "Role", value: user.role.charAt(0).toUpperCase() + user.role.slice(1) },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col items-center rounded-2xl bg-card p-6 shadow-card">
        <div className="mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-3xl">
          👤
        </div>
        <h2 className="text-xl font-bold text-card-foreground">{user.name}</h2>
        <p className="text-sm text-muted-foreground capitalize">{user.role}</p>
      </div>

      <div className="rounded-2xl bg-card p-5 shadow-card">
        <h3 className="mb-3 font-bold text-card-foreground">Personal Info</h3>
        <div className="space-y-4">
          {info.map((item) => (
            <div key={item.label} className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent">
                <item.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="text-sm font-semibold text-card-foreground">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={logout}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-destructive/10 py-4 font-bold text-destructive transition-all active:scale-[0.98]"
      >
        <LogOut className="h-5 w-5" />
        Sign Out
      </button>
    </div>
  );
};

export default ProfilePage;
