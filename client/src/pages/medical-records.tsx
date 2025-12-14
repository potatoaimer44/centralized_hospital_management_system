import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useSearch } from "wouter";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileText, Plus, Search, Calendar, User, Building2, Eye } from "lucide-react";
import type { MedicalRecord, Patient, User as UserType, Hospital } from "@shared/schema";

type MedicalRecordWithRelations = MedicalRecord & {
  patient?: Patient & { user?: UserType };
  doctor?: UserType;
  hospital?: Hospital;
};

export default function MedicalRecordsPage() {
  const searchString = useSearch();
  const urlParams = new URLSearchParams(searchString);
  const patientIdParam = urlParams.get("patientId");

  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState<string>("all");

  const { data: records, isLoading } = useQuery<MedicalRecordWithRelations[]>({
    queryKey: ["/api/medical-records", patientIdParam ? { patientId: patientIdParam } : {}],
  });

  const filteredRecords = records?.filter((record) => {
    const matchesSearch =
      !search ||
      record.diagnosis?.toLowerCase().includes(search.toLowerCase()) ||
      record.chiefComplaint?.toLowerCase().includes(search.toLowerCase()) ||
      record.patient?.user?.firstName?.toLowerCase().includes(search.toLowerCase()) ||
      record.patient?.user?.lastName?.toLowerCase().includes(search.toLowerCase());

    let matchesDate = true;
    if (dateFilter !== "all" && record.visitDate) {
      const visitDate = new Date(record.visitDate);
      const now = new Date();
      if (dateFilter === "week") {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        matchesDate = visitDate >= weekAgo;
      } else if (dateFilter === "month") {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        matchesDate = visitDate >= monthAgo;
      } else if (dateFilter === "year") {
        const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        matchesDate = visitDate >= yearAgo;
      }
    }

    return matchesSearch && matchesDate;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-semibold">Medical Records</h1>
          <p className="text-muted-foreground">
            {patientIdParam ? "Records for selected patient" : "View and manage all medical records"}
          </p>
        </div>
        <Link href="/medical-records/new">
          <Button data-testid="button-new-record">
            <Plus className="mr-2 h-4 w-4" />
            New Record
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by patient, diagnosis..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
                data-testid="input-search-records"
              />
            </div>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-40" data-testid="select-date-filter">
                <SelectValue placeholder="Date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="week">Last Week</SelectItem>
                <SelectItem value="month">Last Month</SelectItem>
                <SelectItem value="year">Last Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredRecords && filteredRecords.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Diagnosis</TableHead>
                    <TableHead>Doctor</TableHead>
                    <TableHead>Hospital</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((record) => (
                    <TableRow key={record.id} data-testid={`row-record-${record.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="font-mono text-sm">
                            {record.visitDate
                              ? new Date(record.visitDate).toLocaleDateString()
                              : "N/A"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {record.patient?.user?.firstName} {record.patient?.user?.lastName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="max-w-xs truncate block">
                          {record.diagnosis || "No diagnosis"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          Dr. {record.doctor?.firstName} {record.doctor?.lastName}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{record.hospital?.name || "N/A"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/medical-records/${record.id}`}>
                          <Button variant="ghost" size="sm" data-testid={`button-view-${record.id}`}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Records Found</h3>
              <p className="text-muted-foreground mb-4">
                {search ? "Try adjusting your search terms" : "No medical records have been created yet"}
              </p>
              <Link href="/medical-records/new">
                <Button data-testid="button-create-first">
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Record
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
