import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  ChevronLeft,
  Calendar,
  User,
  Building2,
  FileText,
  Stethoscope,
  Pill,
  FlaskConical,
  ClipboardList,
  MessageSquare,
  Activity,
  AlertTriangle,
} from "lucide-react";
import type { MedicalRecord, Patient, User as UserType, Hospital, VitalSigns } from "@shared/schema";

type MedicalRecordWithRelations = MedicalRecord & {
  patient?: Patient & { user?: UserType };
  doctor?: UserType;
  hospital?: Hospital;
  vitalSigns?: VitalSigns[];
};

export default function MedicalRecordDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: record, isLoading } = useQuery<MedicalRecordWithRelations>({
    queryKey: ["/api/medical-records", id],
  });

  if (isLoading) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!record) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <Card>
          <CardContent className="p-12 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Record Not Found</h2>
            <p className="text-muted-foreground mb-4">
              This medical record doesn't exist or you don't have access.
            </p>
            <Link href="/medical-records">
              <Button variant="outline">
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back to Records
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const latestVitals = record.vitalSigns?.[0];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4 flex-wrap">
        <Link href="/medical-records">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-semibold" data-testid="text-record-title">
            Medical Record
          </h1>
          <p className="text-sm text-muted-foreground font-mono" data-testid="text-record-id">
            Record ID: {record.id}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Visit Date</p>
              <p className="font-medium" data-testid="text-visit-date">
                {record.visitDate
                  ? new Date(record.visitDate).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "N/A"}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <User className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Patient</p>
              <Link href={`/patients/${record.patient?.id}`}>
                <p className="font-medium hover:underline cursor-pointer" data-testid="text-patient-name">
                  {record.patient?.user?.firstName} {record.patient?.user?.lastName}
                </p>
              </Link>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Building2 className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Hospital</p>
              <p className="font-medium" data-testid="text-hospital">
                {record.hospital?.name || "N/A"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5" />
            Attending Physician
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="font-semibold" data-testid="text-doctor-name">
                Dr. {record.doctor?.firstName} {record.doctor?.lastName}
              </p>
              <p className="text-sm text-muted-foreground">{record.doctor?.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Chief Complaint
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground" data-testid="text-chief-complaint">
              {record.chiefComplaint || "No chief complaint recorded"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Diagnosis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium text-foreground" data-testid="text-diagnosis">
              {record.diagnosis || "No diagnosis recorded"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5" />
            Prescription
          </CardTitle>
        </CardHeader>
        <CardContent>
          {record.prescription ? (
            <pre className="whitespace-pre-wrap font-mono text-sm bg-muted p-4 rounded-md" data-testid="text-prescription">
              {record.prescription}
            </pre>
          ) : (
            <p className="text-muted-foreground">No prescription recorded</p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5" />
              Lab Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            {record.labResults ? (
              <pre className="whitespace-pre-wrap font-mono text-sm bg-muted p-4 rounded-md" data-testid="text-lab-results">
                {record.labResults}
              </pre>
            ) : (
              <p className="text-muted-foreground">No lab results recorded</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Treatment Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            {record.treatmentPlan ? (
              <p className="text-foreground" data-testid="text-treatment-plan">
                {record.treatmentPlan}
              </p>
            ) : (
              <p className="text-muted-foreground">No treatment plan recorded</p>
            )}
          </CardContent>
        </Card>
      </div>

      {record.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground" data-testid="text-notes">
              {record.notes}
            </p>
          </CardContent>
        </Card>
      )}

      {latestVitals && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Vital Signs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {latestVitals.temperature && (
                <div className="p-3 rounded-md bg-muted">
                  <p className="text-sm text-muted-foreground">Temperature</p>
                  <p className="text-xl font-semibold" data-testid="text-temperature">
                    {latestVitals.temperature}°C
                  </p>
                </div>
              )}
              {latestVitals.bloodPressure && (
                <div className="p-3 rounded-md bg-muted">
                  <p className="text-sm text-muted-foreground">Blood Pressure</p>
                  <p className="text-xl font-semibold" data-testid="text-bp">
                    {latestVitals.bloodPressure}
                  </p>
                </div>
              )}
              {latestVitals.pulseRate && (
                <div className="p-3 rounded-md bg-muted">
                  <p className="text-sm text-muted-foreground">Pulse Rate</p>
                  <p className="text-xl font-semibold" data-testid="text-pulse">
                    {latestVitals.pulseRate} bpm
                  </p>
                </div>
              )}
              {latestVitals.respiratoryRate && (
                <div className="p-3 rounded-md bg-muted">
                  <p className="text-sm text-muted-foreground">Respiratory Rate</p>
                  <p className="text-xl font-semibold" data-testid="text-resp">
                    {latestVitals.respiratoryRate} /min
                  </p>
                </div>
              )}
              {latestVitals.weight && (
                <div className="p-3 rounded-md bg-muted">
                  <p className="text-sm text-muted-foreground">Weight</p>
                  <p className="text-xl font-semibold" data-testid="text-weight">
                    {latestVitals.weight} kg
                  </p>
                </div>
              )}
              {latestVitals.height && (
                <div className="p-3 rounded-md bg-muted">
                  <p className="text-sm text-muted-foreground">Height</p>
                  <p className="text-xl font-semibold" data-testid="text-height">
                    {latestVitals.height} cm
                  </p>
                </div>
              )}
              {latestVitals.bmi && (
                <div className="p-3 rounded-md bg-muted">
                  <p className="text-sm text-muted-foreground">BMI</p>
                  <p className="text-xl font-semibold" data-testid="text-bmi">
                    {latestVitals.bmi}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end gap-2">
        <Link href="/medical-records">
          <Button variant="outline" data-testid="button-back-to-list">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Records
          </Button>
        </Link>
      </div>
    </div>
  );
}
