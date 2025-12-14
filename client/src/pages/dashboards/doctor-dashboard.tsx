import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { StatCard } from "@/components/stat-card";
import { AllergyBadge } from "@/components/allergy-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Users, 
  FileText, 
  ClipboardList,
  Plus,
  ArrowRight,
  Calendar,
  Stethoscope
} from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";
import type { Patient, MedicalRecord, AccessRequest, User } from "@shared/schema";

interface PatientWithUser extends Patient {
  user?: User;
}

interface MedicalRecordWithPatient extends MedicalRecord {
  patient?: PatientWithUser;
}

export default function DoctorDashboard() {
  const { user } = useAuth();

  const { data: stats, isLoading: statsLoading } = useQuery<{
    totalPatients: number;
    totalRecords: number;
    pendingRequests: number;
    todayVisits: number;
  }>({
    queryKey: ["/api/doctor/stats"],
  });

  const { data: recentPatients, isLoading: patientsLoading } = useQuery<PatientWithUser[]>({
    queryKey: ["/api/patients", { limit: 5 }],
  });

  const { data: recentRecords, isLoading: recordsLoading } = useQuery<MedicalRecordWithPatient[]>({
    queryKey: ["/api/medical-records", { limit: 5 }],
  });

  const { data: pendingRequests, isLoading: requestsLoading } = useQuery<AccessRequest[]>({
    queryKey: ["/api/access-requests", { status: "pending", limit: 3 }],
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
            Welcome, Dr. {user?.lastName || user?.firstName || "Doctor"}
          </h1>
          <p className="text-muted-foreground">Manage your patients and medical records</p>
        </div>
        <Button asChild data-testid="button-new-record">
          <Link href="/medical-records/new">
            <Plus className="h-4 w-4 mr-2" />
            New Medical Record
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsLoading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
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
              title="My Patients"
              value={stats?.totalPatients || 0}
              icon={Users}
              description="Under your care"
            />
            <StatCard
              title="Medical Records"
              value={stats?.totalRecords || 0}
              icon={FileText}
              description="Created by you"
            />
            <StatCard
              title="Today's Visits"
              value={stats?.todayVisits || 0}
              icon={Calendar}
              description="Scheduled today"
            />
            <StatCard
              title="Pending Requests"
              value={stats?.pendingRequests || 0}
              icon={ClipboardList}
              description="Access requests"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 overflow-visible">
          <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
            <div>
              <CardTitle className="text-lg">Recent Patients</CardTitle>
              <CardDescription>Your recently visited patients</CardDescription>
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
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : recentPatients?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p>No patients yet</p>
                <Button variant="outline" size="sm" className="mt-4" asChild>
                  <Link href="/patients/new">Add Your First Patient</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentPatients?.map((patient) => (
                  <Link key={patient.id} href={`/patients/${patient.id}`}>
                    <div 
                      className="flex items-center justify-between gap-4 p-3 rounded-md hover-elevate cursor-pointer"
                      data-testid={`patient-card-${patient.id}`}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>{getPatientInitials(patient)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold">{getPatientName(patient)}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{patient.gender}</span>
                            <span className="text-muted-foreground/50">|</span>
                            <span>{patient.bloodGroup || "Blood group unknown"}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {patient.allergies && <AllergyBadge allergies={patient.allergies} compact />}
                        <Button variant="ghost" size="sm">
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-visible">
          <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
            <div>
              <CardTitle className="text-lg">Access Requests</CardTitle>
              <CardDescription>Pending approvals</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/access-requests">
                View All
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {requestsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : pendingRequests?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ClipboardList className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p>No pending requests</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingRequests?.map((request) => (
                  <div 
                    key={request.id} 
                    className="p-3 rounded-md bg-muted/50 space-y-2"
                    data-testid={`request-card-${request.id}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-sm">Patient #{request.patientId}</p>
                      <Badge variant="outline" className="text-xs">Pending</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{request.reason}</p>
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1">Approve</Button>
                      <Button size="sm" variant="outline" className="flex-1">Deny</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-visible">
        <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
          <div>
            <CardTitle className="text-lg">Recent Medical Records</CardTitle>
            <CardDescription>Records you've created or updated</CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/medical-records">
              View All
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recordsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : recentRecords?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p>No medical records yet</p>
              <Button variant="outline" size="sm" className="mt-4" asChild>
                <Link href="/medical-records/new">Create Your First Record</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentRecords?.map((record) => (
                <Link key={record.id} href={`/medical-records/${record.id}`}>
                  <Card className="overflow-visible hover-elevate cursor-pointer" data-testid={`record-card-${record.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <Stethoscope className="h-4 w-4 text-primary" />
                          <span className="font-medium text-sm">
                            {getPatientName(record.patient)}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground font-mono">
                          {record.visitDate ? format(new Date(record.visitDate), "MMM dd") : ""}
                        </span>
                      </div>
                      {record.diagnosis && (
                        <p className="text-sm font-medium text-foreground line-clamp-1">
                          {record.diagnosis}
                        </p>
                      )}
                      {record.chiefComplaint && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                          {record.chiefComplaint}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
