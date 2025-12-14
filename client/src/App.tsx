import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/hooks/useAuth";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Skeleton } from "@/components/ui/skeleton";

import Landing from "@/pages/landing";
import Home from "@/pages/home";
import NotFound from "@/pages/not-found";
import UsersPage from "@/pages/users";
import HospitalsPage from "@/pages/hospitals";
import PatientsPage from "@/pages/patients";
import PatientDetailPage from "@/pages/patient-detail";
import MedicalRecordsPage from "@/pages/medical-records";
import MedicalRecordDetailPage from "@/pages/medical-record-detail";
import NewMedicalRecordPage from "@/pages/new-medical-record";
import VitalSignsPage from "@/pages/vital-signs";
import NewVitalSignsPage from "@/pages/new-vital-signs";
import AccessRequestsPage from "@/pages/access-requests";
import AuditLogsPage from "@/pages/audit-logs";
import SecurityAlertsPage from "@/pages/security-alerts";
import MyRecordsPage from "@/pages/my-records";
import MyVitalsPage from "@/pages/my-vitals";

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between gap-4 p-3 border-b bg-background sticky top-0 z-50">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="space-y-4 text-center">
        <Skeleton className="h-12 w-12 mx-auto rounded-full" />
        <Skeleton className="h-4 w-32 mx-auto" />
      </div>
    </div>
  );
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/" component={Landing} />
        <Route component={Landing} />
      </Switch>
    );
  }

  return (
    <AuthenticatedLayout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/users" component={UsersPage} />
        <Route path="/hospitals" component={HospitalsPage} />
        <Route path="/patients" component={PatientsPage} />
        <Route path="/patients/:id" component={PatientDetailPage} />
        <Route path="/medical-records" component={MedicalRecordsPage} />
        <Route path="/medical-records/new" component={NewMedicalRecordPage} />
        <Route path="/medical-records/:id" component={MedicalRecordDetailPage} />
        <Route path="/vital-signs" component={VitalSignsPage} />
        <Route path="/vital-signs/new" component={NewVitalSignsPage} />
        <Route path="/access-requests" component={AccessRequestsPage} />
        <Route path="/audit-logs" component={AuditLogsPage} />
        <Route path="/security-alerts" component={SecurityAlertsPage} />
        <Route path="/my-records" component={MyRecordsPage} />
        <Route path="/my-records/:id" component={MedicalRecordDetailPage} />
        <Route path="/my-vitals" component={MyVitalsPage} />
        <Route component={NotFound} />
      </Switch>
    </AuthenticatedLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="medrecord-theme">
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
