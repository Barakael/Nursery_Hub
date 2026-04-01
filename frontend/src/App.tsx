import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import AppShell from "@/components/AppShell";
import LoginPage from "@/pages/LoginPage";
import Dashboard from "@/pages/Dashboard";
import PerformancePage from "@/pages/PerformancePage";
import PaymentsPage from "@/pages/PaymentsPage";
import TimetablePage from "@/pages/TimetablePage";
import ScoresPage from "@/pages/ScoresPage";
import ProfilePage from "@/pages/ProfilePage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/" replace />;
  return <AppShell>{children}</AppShell>;
};

const LoginRoute = () => {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <LoginPage />;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<LoginRoute />} />
    <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
    <Route path="/performance" element={<ProtectedRoute><PerformancePage /></ProtectedRoute>} />
    <Route path="/payments" element={<ProtectedRoute><PaymentsPage /></ProtectedRoute>} />
    <Route path="/timetable" element={<ProtectedRoute><TimetablePage /></ProtectedRoute>} />
    <Route path="/scores" element={<ProtectedRoute><ScoresPage /></ProtectedRoute>} />
    <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
    <Route path="/students" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
    <Route path="/classes" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
    <Route path="/users" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
    <Route path="/reports" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
    <Route path="/settings" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
    <Route path="*" element={<NotFound />} />
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
