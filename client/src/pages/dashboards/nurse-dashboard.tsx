import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Users, 
  HeartPulse, 
  Plus,
  ArrowRight,
  Thermometer,
  Activity,
  Scale
} from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";
import type { Patient, VitalSigns, User } from "@shared/schema";

interface PatientWithUser extends Patient {
  user?: User;
}

interface VitalSignsWithDetails extends VitalSigns {
  medicalRecord?: {
    patient?: PatientWithUser;
  };
}

export default function NurseDashboard() {
  const { user } = useAuth();

  const { data: stats, isLoading: statsLoading } = useQuery<{
    totalPatients: number;
    vitalsTodayCount: number;
    pendingVitals: number;
  }>({
    queryKey: ["/api/nurse/stats"],
  });

  const { data: recentPatients, isLoading: patientsLoading } = useQuery<PatientWithUser[]>({
    queryKey: ["/api/patients", { limit: 6 }],
  });

  const { data: recentVitals, isLoading: vitalsLoading } = useQuery<VitalSignsWithDetails[]>({
    queryKey: ["/api/vital-signs", { limit: 5 }],
  });

  const getPatientName = (patient: PatientWithUser | undefined) => {
    if (!patient?.user) return "Unknown Patient";
    return patient.user.firstName && patient.user.lastName
      ? `${patient.user.firstName} ${patient.user.lastName}`
      : patient.user.email || "Unknown";
  };

  const getPatientInitials = (patient: PatientWithUser | undefined) => {
    if (!patient?.user) return "?";
    return patient.user.firstName?.[0] || patient.user.email?.[0]?.toUpperCase() || "?";
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-semibold">
            Welcome, {user?.firstName || "Nurse"}
          </h1>
          <p className="text-muted-foreground">Record vital signs and assist with patient care</p>
        </div>
        <Button asChild data-testid="button-record-vitals">
          <Link href="/vital-signs/new">
            <Plus className="h-4 w-4 mr-2" />
            Record Vital Signs
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statsLoading ? (
          <>
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </>
        ) : (
          <>
            <StatCard
              title="Total Patients"
              value={stats?.totalPatients || 0}
              icon={Users}
              description="In the system"
            />
            <StatCard
              title="Vitals Recorded Today"
              value={stats?.vitalsTodayCount || 0}
              icon={HeartPulse}
              description="Completed today"
            />
            <StatCard
              title="Pending Vitals"
              value={stats?.pendingVitals || 0}
              icon={Activity}
              description="Awaiting recording"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="overflow-visible">
          <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
            <div>
              <CardTitle className="text-lg">Patients</CardTitle>
              <CardDescription>Quick access to record vitals</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/patients">
                View All
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {patientsLoading ? (
              <div className="grid grid-cols-2 gap-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : recentPatients?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p>No patients in the system</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {recentPatients?.map((patient) => (
                  <div 
                    key={patient.id} 
                    className="flex items-center gap-3 p-3 rounded-md bg-muted/50 hover-elevate"
                    data-testid={`patient-quick-${patient.id}`}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>{getPatientInitials(patient)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{getPatientName(patient)}</p>
                      <p className="text-xs text-muted-foreground">{patient.bloodGroup || "N/A"}</p>
                    </div>
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/vital-signs/new?patientId=${patient.id}`}>
                        <HeartPulse className="h-3 w-3" />
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-visible">
          <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
            <div>
              <CardTitle className="text-lg">Recently Recorded Vitals</CardTitle>
              <CardDescription>Your recent recordings</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/vital-signs">
                View All
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {vitalsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : recentVitals?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <HeartPulse className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p>No vitals recorded yet</p>
                <Button variant="outline" size="sm" className="mt-4" asChild>
                  <Link href="/vital-signs/new">Record First Vital Signs</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentVitals?.map((vitals) => (
                  <div 
                    key={vitals.id} 
                    className="p-3 rounded-md bg-muted/50"
                    data-testid={`vitals-item-${vitals.id}`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <p className="font-medium text-sm">
                        {getPatientName(vitals.medicalRecord?.patient)}
                      </p>
                      <span className="text-xs text-muted-foreground font-mono">
                        {vitals.recordedAt ? format(new Date(vitals.recordedAt), "HH:mm") : ""}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-xs">
                      <div className="flex items-center gap-1">
                        <Thermometer className="h-3 w-3 text-muted-foreground" />
                        <span>{vitals.temperature || "-"}°C</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Activity className="h-3 w-3 text-muted-foreground" />
                        <span>{vitals.bloodPressure || "-"}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <HeartPulse className="h-3 w-3 text-muted-foreground" />
                        <span>{vitals.pulseRate || "-"} bpm</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Scale className="h-3 w-3 text-muted-foreground" />
                        <span>{vitals.weight || "-"} kg</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-visible">
        <CardHeader>
          <CardTitle className="text-lg">Quick Reference - Normal Vital Ranges (Teenagers)</CardTitle>
          <CardDescription>Standard reference values for patient assessment</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-md bg-muted/50 text-center">
              <Thermometer className="h-6 w-6 mx-auto mb-2 text-primary" />
              <p className="font-medium">Temperature</p>
              <p className="text-sm text-muted-foreground">36.1 - 37.2°C</p>
            </div>
            <div className="p-4 rounded-md bg-muted/50 text-center">
              <Activity className="h-6 w-6 mx-auto mb-2 text-primary" />
              <p className="font-medium">Blood Pressure</p>
              <p className="text-sm text-muted-foreground">90/60 - 120/80 mmHg</p>
            </div>
            <div className="p-4 rounded-md bg-muted/50 text-center">
              <HeartPulse className="h-6 w-6 mx-auto mb-2 text-primary" />
              <p className="font-medium">Pulse Rate</p>
              <p className="text-sm text-muted-foreground">60 - 100 bpm</p>
            </div>
            <div className="p-4 rounded-md bg-muted/50 text-center">
              <Activity className="h-6 w-6 mx-auto mb-2 text-primary" />
              <p className="font-medium">Respiratory Rate</p>
              <p className="text-sm text-muted-foreground">12 - 20 breaths/min</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
