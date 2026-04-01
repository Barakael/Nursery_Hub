import { useAuth } from "@/contexts/AuthContext";
import ParentDashboard from "@/components/dashboards/ParentDashboard";
import TeacherDashboard from "@/components/dashboards/TeacherDashboard";
import AdminDashboard from "@/components/dashboards/AdminDashboard";

const Dashboard = () => {
  const { user } = useAuth();

  if (!user) return null;

  switch (user.role) {
    case "parent":
      return <ParentDashboard />;
    case "teacher":
      return <TeacherDashboard />;
    case "admin":
    case "school":
      return <AdminDashboard />;
    default:
      return null;
  }
};

export default Dashboard;
