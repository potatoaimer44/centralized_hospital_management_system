import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { AllergyBadge } from "@/components/allergy-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  FileText, 
  HeartPulse, 
  Building2,
  ArrowRight,
  Calendar,
  Stethoscope,
  Phone,
  User,
  Thermometer,
  Activity,
  Scale
} from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";
import type { Patient, MedicalRecord, VitalSigns, Hospital, User as UserType } from "@shared/schema";

interface PatientProfile extends Patient {
  user?: UserType;
}

interface MedicalRecordWithDetails extends MedicalRecord {
  hospital?: Hospital;
  doctor?: UserType;
}

export default function PatientDashboard() {
  const { user } = useAuth();

  const { data: patientProfile, isLoading: profileLoading } = useQuery<PatientProfile>({
    queryKey: ["/api/patients/me"],
  });

  const { data: recentRecords, isLoading: recordsLoading } = useQuery<MedicalRecordWithDetails[]>({
    queryKey: ["/api/patients/me/records", { limit: 5 }],
  });

  const { data: recentVitals, isLoading: vitalsLoading } = useQuery<VitalSigns[]>({
    queryKey: ["/api/patients/me/vitals", { limit: 3 }],
  });

  const getAge = (dateOfBirth: string | Date) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-semibold">
          Welcome, {user?.firstName || "Patient"}
        </h1>
        <p className="text-muted-foreground">View your medical records and health information</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 overflow-visible">
          <CardHeader>
            <CardTitle className="text-lg">My Profile</CardTitle>
            <CardDescription>Your personal and medical information</CardDescription>
          </CardHeader>
          <CardContent>
            {profileLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : patientProfile ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-3 rounded-md bg-muted/50">
                  <div className="p-3 bg-primary/10 rounded-full">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {getAge(patientProfile.dateOfBirth)} years old | {patientProfile.gender}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Blood Group</span>
                    <Badge variant="outline">{patientProfile.bloodGroup || "Not specified"}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Address</span>
                    <span className="text-right max-w-[60%] truncate">{patientProfile.address || "Not specified"}</span>
                  </div>
                </div>

                {patientProfile.allergies && (
                  <AllergyBadge allergies={patientProfile.allergies} />
                )}

                {patientProfile.guardianName && (
                  <div className="p-3 rounded-md bg-muted/50 space-y-2">
                    <p className="text-sm font-medium">Guardian Information</p>
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{patientProfile.guardianName} ({patientProfile.guardianRelation})</span>
                    </div>
                    {patientProfile.guardianPhone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{patientProfile.guardianPhone}</span>
                      </div>
                    )}
                  </div>
                )}

                {patientProfile.emergencyContact && (
                  <div className="p-3 rounded-md bg-red-50 dark:bg-red-900/20 space-y-1">
                    <p className="text-sm font-medium text-red-700 dark:text-red-300">Emergency Contact</p>
                    <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                      <Phone className="h-4 w-4" />
                      <span>{patientProfile.emergencyContact}</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <User className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p>Profile not found</p>
                <p className="text-xs mt-1">Please contact administration</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 overflow-visible">
          <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
            <div>
              <CardTitle className="text-lg">Recent Vital Signs</CardTitle>
              <CardDescription>Your latest health measurements</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/my-vitals">
                View History
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {vitalsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : recentVitals?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <HeartPulse className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p>No vital signs recorded yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentVitals?.map((vitals) => (
                  <div 
                    key={vitals.id} 
                    className="p-4 rounded-md bg-muted/50"
                    data-testid={`vitals-card-${vitals.id}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {vitals.recordedAt ? format(new Date(vitals.recordedAt), "MMMM d, yyyy") : ""}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground font-mono">
                        {vitals.recordedAt ? format(new Date(vitals.recordedAt), "HH:mm") : ""}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="flex items-center gap-2">
                        <Thermometer className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Temperature</p>
                          <p className="font-medium">{vitals.temperature || "-"}°C</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Blood Pressure</p>
                          <p className="font-medium">{vitals.bloodPressure || "-"} mmHg</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <HeartPulse className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Pulse Rate</p>
                          <p className="font-medium">{vitals.pulseRate || "-"} bpm</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Scale className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Weight</p>
                          <p className="font-medium">{vitals.weight || "-"} kg</p>
                        </div>
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
        <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
          <div>
            <CardTitle className="text-lg">Medical Records</CardTitle>
            <CardDescription>Your complete medical history across hospitals</CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/my-records">
              View All Records
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recordsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : recentRecords?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No medical records yet</p>
              <p className="text-sm mt-1">Records will appear here after your first visit</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentRecords?.map((record) => (
                <Card 
                  key={record.id} 
                  className="overflow-visible hover-elevate cursor-pointer"
                  data-testid={`record-card-${record.id}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3 flex-wrap">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {record.visitDate ? format(new Date(record.visitDate), "MMMM d, yyyy") : ""}
                            </span>
                          </div>
                          {record.hospital && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Building2 className="h-3 w-3" />
                              <span>{record.hospital.name}</span>
                            </div>
                          )}
                        </div>
                        
                        {record.diagnosis && (
                          <div>
                            <p className="text-sm font-medium">Diagnosis</p>
                            <p className="text-sm text-muted-foreground">{record.diagnosis}</p>
                          </div>
                        )}
                        
                        {record.doctor && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Stethoscope className="h-3 w-3" />
                            <span>Dr. {record.doctor.firstName} {record.doctor.lastName}</span>
                          </div>
                        )}
                      </div>
                      
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/my-records/${record.id}`}>
                          View Details
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
