import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Activity, Plus, Search, Calendar, User, Thermometer, Heart, Scale } from "lucide-react";
import type { VitalSigns, MedicalRecord, Patient, User as UserType } from "@shared/schema";

type VitalSignsWithRelations = VitalSigns & {
  medicalRecord?: MedicalRecord & {
    patient?: Patient & { user?: UserType };
  };
  recorder?: UserType;
};

export default function VitalSignsPage() {
  const [search, setSearch] = useState("");

  const { data: vitalSigns, isLoading } = useQuery<VitalSignsWithRelations[]>({
    queryKey: ["/api/vital-signs"],
  });

  const filteredVitals = vitalSigns?.filter((vitals) => {
    if (!search) return true;
    const patientName = `${vitals.medicalRecord?.patient?.user?.firstName || ""} ${vitals.medicalRecord?.patient?.user?.lastName || ""}`;
    return patientName.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-semibold">Vital Signs</h1>
          <p className="text-muted-foreground">View and record patient vital signs</p>
        </div>
        <Link href="/vital-signs/new">
          <Button data-testid="button-new-vitals">
            <Plus className="mr-2 h-4 w-4" />
            Record Vitals
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by patient name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
              data-testid="input-search-vitals"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredVitals && filteredVitals.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date/Time</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>
                      <div className="flex items-center gap-1">
                        <Thermometer className="h-4 w-4" />
                        Temp
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center gap-1">
                        <Heart className="h-4 w-4" />
                        BP
                      </div>
                    </TableHead>
                    <TableHead>Pulse</TableHead>
                    <TableHead>Resp</TableHead>
                    <TableHead>
                      <div className="flex items-center gap-1">
                        <Scale className="h-4 w-4" />
                        Weight
                      </div>
                    </TableHead>
                    <TableHead>Height</TableHead>
                    <TableHead>BMI</TableHead>
                    <TableHead>Recorded By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVitals.map((vitals) => (
                    <TableRow key={vitals.id} data-testid={`row-vitals-${vitals.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="font-mono text-sm">
                            {vitals.recordedAt
                              ? new Date(vitals.recordedAt).toLocaleString()
                              : "N/A"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {vitals.medicalRecord?.patient?.user?.firstName}{" "}
                            {vitals.medicalRecord?.patient?.user?.lastName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {vitals.temperature ? `${vitals.temperature}°C` : "-"}
                      </TableCell>
                      <TableCell>{vitals.bloodPressure || "-"}</TableCell>
                      <TableCell>
                        {vitals.pulseRate ? `${vitals.pulseRate} bpm` : "-"}
                      </TableCell>
                      <TableCell>
                        {vitals.respiratoryRate ? `${vitals.respiratoryRate}/min` : "-"}
                      </TableCell>
                      <TableCell>
                        {vitals.weight ? `${vitals.weight} kg` : "-"}
                      </TableCell>
                      <TableCell>
                        {vitals.height ? `${vitals.height} cm` : "-"}
                      </TableCell>
                      <TableCell>{vitals.bmi || "-"}</TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {vitals.recorder?.firstName} {vitals.recorder?.lastName}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Vital Signs Found</h3>
              <p className="text-muted-foreground mb-4">
                {search ? "Try adjusting your search" : "No vital signs have been recorded yet"}
              </p>
              <Link href="/vital-signs/new">
                <Button data-testid="button-record-first">
                  <Plus className="mr-2 h-4 w-4" />
                  Record First Vitals
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
