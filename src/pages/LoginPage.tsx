import { useAuth, UserRole } from "@/contexts/AuthContext";
import { GraduationCap, Users, BookOpen, Shield } from "lucide-react";

const roles: { role: UserRole; label: string; icon: React.ElementType; desc: string }[] = [
  { role: "parent", label: "Parent", icon: Users, desc: "View your child's progress" },
  { role: "teacher", label: "Teacher", icon: BookOpen, desc: "Manage scores & classes" },
  { role: "school", label: "School Admin", icon: GraduationCap, desc: "Manage students & classes" },
  { role: "admin", label: "System Admin", icon: Shield, desc: "Full system control" },
];

const LoginPage = () => {
  const { login } = useAuth();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-primary px-6">
      <div className="mb-10 text-center">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-secondary shadow-elevated">
          <GraduationCap className="h-10 w-10 text-secondary-foreground" />
        </div>
        <h1 className="text-3xl font-extrabold text-primary-foreground">NurseryHub</h1>
        <p className="mt-1 text-sm font-medium text-primary-foreground/60">
          School Management Made Simple
        </p>
      </div>

      <div className="w-full max-w-sm space-y-3">
        {roles.map(({ role, label, icon: Icon, desc }) => (
          <button
            key={role}
            onClick={() => login(role)}
            className="flex w-full items-center gap-4 rounded-2xl bg-primary-foreground/10 px-5 py-4 text-left transition-all hover:bg-primary-foreground/20 active:scale-[0.98]"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary/20">
              <Icon className="h-6 w-6 text-secondary" />
            </div>
            <div>
              <p className="font-bold text-primary-foreground">{label}</p>
              <p className="text-xs text-primary-foreground/60">{desc}</p>
            </div>
          </button>
        ))}
      </div>

      <p className="mt-10 text-xs text-primary-foreground/40">Demo login — tap a role to continue</p>
    </div>
  );
};

export default LoginPage;
