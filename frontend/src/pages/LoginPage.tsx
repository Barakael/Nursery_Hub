import { useState } from "react";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { GraduationCap, Eye, EyeOff, LogIn } from "lucide-react";

const demoAccounts: { role: UserRole; email: string; password: string; label: string }[] = [
  { role: "parent", email: "parent@nurseryhub.demo", password: "demo1234", label: "Parent" },
  { role: "teacher", email: "teacher@nurseryhub.demo", password: "demo1234", label: "Teacher" },
  { role: "school", email: "school@nurseryhub.demo", password: "demo1234", label: "School Admin" },
  { role: "admin", email: "admin@nurseryhub.demo", password: "demo1234", label: "System Admin" },
];

const LoginPage = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const account = demoAccounts.find((a) => a.email === email && a.password === password);
    if (account) {
      login(account.role);
    }
  };

  const fillDemo = (account: typeof demoAccounts[0]) => {
    setEmail(account.email);
    setPassword(account.password);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-primary px-6">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary-foreground/10 shadow-elevated">
          <GraduationCap className="h-10 w-10 text-primary-foreground" />
        </div>
        <h1 className="text-3xl font-extrabold text-primary-foreground">NurseryHub</h1>
        <p className="mt-1 text-sm font-medium text-primary-foreground/60">
          School Management Made Simple
        </p>
      </div>

      {/* Login Form */}
      <div className="w-full max-w-sm">
        <form onSubmit={handleSubmit} className="rounded-2xl bg-card p-6 shadow-elevated space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full rounded-xl border border-input bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full rounded-xl border border-input bg-background px-4 py-3 pr-12 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={!email || !password}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 font-bold text-primary-foreground shadow-soft transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <LogIn className="h-5 w-5" />
            Sign In
          </button>
        </form>

        {/* Demo Accounts */}
        <div className="mt-6">
          <p className="mb-3 text-center text-xs font-semibold text-primary-foreground/50">
            Quick Demo Access
          </p>
          <div className="grid grid-cols-2 gap-2">
            {demoAccounts.map((account) => (
              <button
                key={account.role}
                onClick={() => fillDemo(account)}
                className="rounded-xl bg-primary-foreground/10 px-3 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary-foreground/20 active:scale-[0.97]"
              >
                {account.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <p className="mt-8 text-xs text-primary-foreground/30">
        Tap a demo role to auto-fill credentials, then sign in
      </p>
    </div>
  );
};

export default LoginPage;
