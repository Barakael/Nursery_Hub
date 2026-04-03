import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import AppShell from "@/components/AppShell";
import LoginPage from "@/pages/LoginPage";
import ReportsPage from "@/pages/ReportsPage";
import PerformancePage from "@/pages/PerformancePage";
import PaymentsPage from "@/pages/PaymentsPage";
import TimetablePage from "@/pages/TimetablePage";
import ScoresPage from "@/pages/ScoresPage";
import ProfilePage from "@/pages/ProfilePage";
import StudentsPage from "@/pages/StudentsPage";
import ClassesPage from "@/pages/ClassesPage";
import UsersPage from "@/pages/UsersPage";
import SettingsPage from "@/pages/SettingsPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/" replace />;
  return <AppShell>{children}</AppShell>;
};

const LoginRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <LoginPage />;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<LoginRoute />} />
    <Route path="/dashboard"   element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
    <Route path="/performance" element={<ProtectedRoute><PerformancePage /></ProtectedRoute>} />
    <Route path="/payments"    element={<ProtectedRoute><PaymentsPage /></ProtectedRoute>} />
    <Route path="/timetable"   element={<ProtectedRoute><TimetablePage /></ProtectedRoute>} />
    <Route path="/scores"      element={<ProtectedRoute><ScoresPage /></ProtectedRoute>} />
    <Route path="/profile"     element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
    <Route path="/students"    element={<ProtectedRoute><StudentsPage /></ProtectedRoute>} />
    <Route path="/classes"     element={<ProtectedRoute><ClassesPage /></ProtectedRoute>} />
    <Route path="/users"       element={<ProtectedRoute><UsersPage /></ProtectedRoute>} />
    <Route path="/reports"     element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
    <Route path="/settings"    element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
    <Route path="*"            element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

