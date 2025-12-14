import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import {
  FileText,
  Search,
  Calendar,
  Building2,
  User,
  ChevronRight,
  Stethoscope,
} from "lucide-react";
import type { MedicalRecord, Hospital, User as UserType } from "@shared/schema";

type MedicalRecordWithRelations = MedicalRecord & {
  doctor?: UserType;
  hospital?: Hospital;
};

export default function MyRecordsPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [yearFilter, setYearFilter] = useState<string>("all");

  const { data: records, isLoading } = useQuery<MedicalRecordWithRelations[]>({
    queryKey: ["/api/my-records"],
  });

  const years = records
    ? Array.from(
        new Set(
          records
            .filter((r) => r.visitDate)
            .map((r) => new Date(r.visitDate!).getFullYear())
        )
      ).sort((a, b) => b - a)
    : [];

  const filteredRecords = records?.filter((record) => {
    const matchesSearch =
      !search ||
      record.diagnosis?.toLowerCase().includes(search.toLowerCase()) ||
      record.chiefComplaint?.toLowerCase().includes(search.toLowerCase()) ||
      record.hospital?.name?.toLowerCase().includes(search.toLowerCase()) ||
      record.doctor?.firstName?.toLowerCase().includes(search.toLowerCase()) ||
      record.doctor?.lastName?.toLowerCase().includes(search.toLowerCase());

    const matchesYear =
      yearFilter === "all" ||
      (record.visitDate &&
        new Date(record.visitDate).getFullYear().toString() === yearFilter);

    return matchesSearch && matchesYear;
  });

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">My Medical Records</h1>
        <p className="text-muted-foreground">
          View your complete medical history
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search records..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
                data-testid="input-search-my-records"
              />
            </div>
            {years.length > 0 && (
              <Select value={yearFilter} onValueChange={setYearFilter}>
                <SelectTrigger className="w-32" data-testid="select-year-filter">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : filteredRecords && filteredRecords.length > 0 ? (
            <div className="space-y-4">
              {filteredRecords.map((record) => (
                <Link key={record.id} href={`/my-records/${record.id}`}>
                  <Card className="hover-elevate cursor-pointer" data-testid={`card-my-record-${record.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-3 flex-wrap">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="font-mono text-sm">
                                {record.visitDate
                                  ? new Date(record.visitDate).toLocaleDateString("en-US", {
                                      year: "numeric",
                                      month: "long",
                                      day: "numeric",
                                    })
                                  : "N/A"}
                              </span>
                            </div>
                            <Badge variant="secondary">
                              <Building2 className="mr-1 h-3 w-3" />
                              {record.hospital?.name || "Unknown Hospital"}
                            </Badge>
                          </div>
                          <h3 className="font-semibold text-lg">
                            {record.diagnosis || "General Checkup"}
                          </h3>
                          {record.chiefComplaint && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {record.chiefComplaint}
                            </p>
                          )}
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Stethoscope className="h-4 w-4" />
                            <span>
                              Dr. {record.doctor?.firstName} {record.doctor?.lastName}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Medical Records</h3>
              <p className="text-muted-foreground">
                {search || yearFilter !== "all"
                  ? "No records match your search"
                  : "You don't have any medical records yet"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
