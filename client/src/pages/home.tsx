import { useAuth } from "@/hooks/useAuth";
import AdminDashboard from "@/pages/dashboards/admin-dashboard";
import DoctorDashboard from "@/pages/dashboards/doctor-dashboard";
import NurseDashboard from "@/pages/dashboards/nurse-dashboard";
import PatientDashboard from "@/pages/dashboards/patient-dashboard";
import type { UserRole } from "@shared/schema";

export default function Home() {
  const { user } = useAuth();
  const role = (user?.role as UserRole) || "patient";

  switch (role) {
    case "admin":
      return <AdminDashboard />;
    case "doctor":
      return <DoctorDashboard />;
    case "nurse":
      return <NurseDashboard />;
    case "patient":
    default:
      return <PatientDashboard />;
  }
}
