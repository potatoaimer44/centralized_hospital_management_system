import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import {
  Activity,
  Calendar,
  Thermometer,
  Heart,
  Scale,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import type { VitalSigns, MedicalRecord } from "@shared/schema";

type VitalSignsWithRecord = VitalSigns & {
  medicalRecord?: MedicalRecord;
};

export default function MyVitalsPage() {
  const { user } = useAuth();

  const { data: vitals, isLoading } = useQuery<VitalSignsWithRecord[]>({
    queryKey: ["/api/my-vitals"],
  });

  const latestVitals = vitals?.[0];
  const previousVitals = vitals?.[1];

  const getChangeIndicator = (current: string | number | null | undefined, previous: string | number | null | undefined) => {
    if (!current || !previous) return null;
    const curr = typeof current === "string" ? parseFloat(current) : current;
    const prev = typeof previous === "string" ? parseFloat(previous) : previous;
    if (curr > prev) {
      return <TrendingUp className="h-3 w-3 text-red-500" />;
    } else if (curr < prev) {
      return <TrendingDown className="h-3 w-3 text-green-500" />;
    }
    return null;
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">My Vital Signs</h1>
        <p className="text-muted-foreground">
          Track your health measurements over time
        </p>
      </div>

      {latestVitals && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Thermometer className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Temperature</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-semibold" data-testid="stat-temperature">
                  {latestVitals.temperature ? `${latestVitals.temperature}°C` : "-"}
                </span>
                {getChangeIndicator(latestVitals.temperature, previousVitals?.temperature)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Heart className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Blood Pressure</span>
              </div>
              <span className="text-2xl font-semibold" data-testid="stat-bp">
                {latestVitals.bloodPressure || "-"}
              </span>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Pulse Rate</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-semibold" data-testid="stat-pulse">
                  {latestVitals.pulseRate ? `${latestVitals.pulseRate} bpm` : "-"}
                </span>
                {getChangeIndicator(latestVitals.pulseRate, previousVitals?.pulseRate)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Scale className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">BMI</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-semibold" data-testid="stat-bmi">
                  {latestVitals.bmi || "-"}
                </span>
                {getChangeIndicator(latestVitals.bmi, previousVitals?.bmi)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Vital Signs History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : vitals && vitals.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Temperature</TableHead>
                    <TableHead>Blood Pressure</TableHead>
                    <TableHead>Pulse</TableHead>
                    <TableHead>Respiratory</TableHead>
                    <TableHead>Weight</TableHead>
                    <TableHead>Height</TableHead>
                    <TableHead>BMI</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vitals.map((v) => (
                    <TableRow key={v.id} data-testid={`row-vital-${v.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="font-mono text-sm">
                            {v.recordedAt
                              ? new Date(v.recordedAt).toLocaleDateString()
                              : "N/A"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {v.temperature ? `${v.temperature}°C` : "-"}
                      </TableCell>
                      <TableCell>{v.bloodPressure || "-"}</TableCell>
                      <TableCell>
                        {v.pulseRate ? `${v.pulseRate} bpm` : "-"}
                      </TableCell>
                      <TableCell>
                        {v.respiratoryRate ? `${v.respiratoryRate}/min` : "-"}
                      </TableCell>
                      <TableCell>
                        {v.weight ? `${v.weight} kg` : "-"}
                      </TableCell>
                      <TableCell>
                        {v.height ? `${v.height} cm` : "-"}
                      </TableCell>
                      <TableCell>{v.bmi || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Vital Signs Recorded</h3>
              <p className="text-muted-foreground">
                Your vital signs history will appear here after your next visit
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
