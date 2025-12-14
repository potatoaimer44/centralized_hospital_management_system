import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AllergyBadge } from "@/components/allergy-badge";
import { RoleBadge } from "@/components/role-badge";
import {
  User,
  Calendar,
  Phone,
  MapPin,
  Droplets,
  Heart,
  FileText,
  Activity,
  ChevronLeft,
  Plus,
  AlertTriangle,
} from "lucide-react";
import type { Patient, User as UserType, MedicalRecord, VitalSigns } from "@shared/schema";

type PatientWithUser = Patient & {
  user: UserType;
  medicalRecords?: (MedicalRecord & { doctor?: UserType })[];
};

export default function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: patient, isLoading } = useQuery<PatientWithUser>({
    queryKey: ["/api/patients", id],
  });

  if (isLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-48" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-48" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <Card>
          <CardContent className="p-12 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Patient Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The patient you're looking for doesn't exist or you don't have access.
            </p>
            <Link href="/patients">
              <Button variant="outline">
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back to Patients
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const age = patient.dateOfBirth
    ? Math.floor(
        (new Date().getTime() - new Date(patient.dateOfBirth).getTime()) /
          (365.25 * 24 * 60 * 60 * 1000)
      )
    : null;

  const allergies = patient.allergies
    ? patient.allergies.split(",").map((a) => a.trim())
    : [];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-4 flex-wrap">
        <Link href="/patients">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-semibold" data-testid="text-patient-name">
            {patient.user?.firstName} {patient.user?.lastName}
          </h1>
          <p className="text-sm text-muted-foreground font-mono" data-testid="text-patient-id">
            Patient ID: {patient.id}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link href={`/medical-records/new?patientId=${patient.id}`}>
            <Button data-testid="button-add-record">
              <Plus className="mr-2 h-4 w-4" />
              Add Record
            </Button>
          </Link>
          <Link href={`/vital-signs/new?patientId=${patient.id}`}>
            <Button variant="outline" data-testid="button-add-vitals">
              <Activity className="mr-2 h-4 w-4" />
              Record Vitals
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Patient Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Date of Birth:</span>
                  <span className="font-medium" data-testid="text-dob">
                    {patient.dateOfBirth
                      ? new Date(patient.dateOfBirth).toLocaleDateString()
                      : "N/A"}
                    {age !== null && ` (${age} years)`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Gender:</span>
                  <span className="font-medium" data-testid="text-gender">
                    {patient.gender || "N/A"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Droplets className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Blood Group:</span>
                  <Badge variant="secondary" data-testid="badge-blood-group">
                    {patient.bloodGroup || "Unknown"}
                  </Badge>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Phone:</span>
                  <span className="font-medium" data-testid="text-phone">
                    {patient.user?.phone || "N/A"}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span className="text-sm text-muted-foreground">Address:</span>
                  <span className="font-medium" data-testid="text-address">
                    {patient.address || "N/A"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {allergies.length > 0 && (
            <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="h-5 w-5" />
                  Allergies
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {allergies.map((allergy, idx) => (
                    <AllergyBadge key={idx} allergy={allergy} />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Medical Records
              </CardTitle>
              <Link href={`/medical-records?patientId=${patient.id}`}>
                <Button variant="ghost" size="sm" data-testid="link-view-all-records">
                  View All
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {patient.medicalRecords && patient.medicalRecords.length > 0 ? (
                <div className="space-y-3">
                  {patient.medicalRecords.slice(0, 5).map((record) => (
                    <Link key={record.id} href={`/medical-records/${record.id}`}>
                      <div
                        className="p-3 rounded-md border hover-elevate cursor-pointer"
                        data-testid={`card-record-${record.id}`}
                      >
                        <div className="flex items-center justify-between gap-4 flex-wrap">
                          <div>
                            <p className="font-medium">{record.diagnosis || "No diagnosis"}</p>
                            <p className="text-sm text-muted-foreground">
                              {record.visitDate
                                ? new Date(record.visitDate).toLocaleDateString()
                                : "N/A"}
                              {record.doctor && ` - Dr. ${record.doctor.firstName} ${record.doctor.lastName}`}
                            </p>
                          </div>
                          <ChevronLeft className="h-4 w-4 rotate-180 text-muted-foreground" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-6">No medical records found</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                Emergency Contact
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {patient.guardianName ? (
                <>
                  <div>
                    <p className="text-sm text-muted-foreground">Guardian Name</p>
                    <p className="font-medium" data-testid="text-guardian-name">
                      {patient.guardianName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Relationship</p>
                    <p className="font-medium" data-testid="text-guardian-relation">
                      {patient.guardianRelation || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium" data-testid="text-guardian-phone">
                      {patient.guardianPhone || "N/A"}
                    </p>
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground">No guardian information</p>
              )}
              {patient.emergencyContact && (
                <div className="pt-2 border-t">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Phone className="h-3 w-3 text-red-500" />
                    Emergency
                  </p>
                  <p className="font-medium" data-testid="text-emergency-contact">
                    {patient.emergencyContact}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href={`/medical-records/new?patientId=${patient.id}`}>
                <Button variant="outline" className="w-full justify-start" data-testid="button-quick-record">
                  <FileText className="mr-2 h-4 w-4" />
                  New Medical Record
                </Button>
              </Link>
              <Link href={`/vital-signs/new?patientId=${patient.id}`}>
                <Button variant="outline" className="w-full justify-start" data-testid="button-quick-vitals">
                  <Activity className="mr-2 h-4 w-4" />
                  Record Vital Signs
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
