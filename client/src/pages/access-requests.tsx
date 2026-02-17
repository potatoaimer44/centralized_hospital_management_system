import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import {
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  User,
  FileText,
  Loader2,
  Plus,
  Search,
} from "lucide-react";
import type { AccessRequest, User as UserType, Patient } from "@shared/schema";

type AccessRequestWithRelations = AccessRequest & {
  requester?: UserType;
  patient?: Patient & { user?: UserType };
  approver?: UserType;
};

export default function AccessRequestsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  // For the "Request Access" dialog (doctor only)
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [reason, setReason] = useState("");

  const { data: requests, isLoading } = useQuery<AccessRequestWithRelations[]>({
    queryKey: ["/api/access-requests"],
  });

  // Load patients list for doctors to select from
  const { data: patients } = useQuery<(Patient & { user: UserType | null })[]>({
    queryKey: ["/api/patients"],
    enabled: user?.role === "doctor",
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await apiRequest("PATCH", `/api/access-requests/${id}`, { status });
      return response.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/access-requests"] });
      toast({
        title: "Success",
        description: `Request ${variables.status} successfully`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update request",
        variant: "destructive",
      });
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: { patientId: number; reason: string }) => {
      const response = await apiRequest("POST", "/api/access-requests", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/access-requests"] });
      setDialogOpen(false);
      setSelectedPatientId("");
      setReason("");
      toast({
        title: "Request Sent",
        description: "Your access request has been sent to the patient for approval.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create request",
        variant: "destructive",
      });
    },
  });

  const filteredRequests = requests?.filter((request) => {
    const matchesStatus = statusFilter === "all" || request.status === statusFilter;
    const matchesSearch =
      !searchTerm ||
      request.requester?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.requester?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.patient?.user?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.patient?.user?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.reason?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "approved":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            <CheckCircle className="mr-1 h-3 w-3" />
            Approved
          </Badge>
        );
      case "denied":
        return (
          <Badge variant="destructive">
            <XCircle className="mr-1 h-3 w-3" />
            Denied
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <Clock className="mr-1 h-3 w-3" />
            Pending
          </Badge>
        );
    }
  };

  // Patients can approve/deny requests for their own records; admins can approve/deny any
  const canReview = user?.role === "patient" || user?.role === "admin";
  const isDoctor = user?.role === "doctor";

  const pendingCount = requests?.filter((r) => r.status === "pending").length ?? 0;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-semibold">Access Requests</h1>
          <p className="text-muted-foreground">
            {user?.role === "patient"
              ? "Doctors need your permission to view your medical records. Review and approve or deny their requests below."
              : user?.role === "doctor"
              ? "Request access to patient medical records. Patients must approve before you can view their records."
              : "Manage requests for patient record access"}
          </p>
        </div>
        {isDoctor && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-request-access">
                <Plus className="h-4 w-4 mr-2" />
                Request Access
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Request Medical Record Access</DialogTitle>
                <DialogDescription>
                  Select a patient and provide a reason. The patient will be notified and must approve your request.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Patient</label>
                  <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
                    <SelectTrigger data-testid="select-patient">
                      <SelectValue placeholder="Select a patient" />
                    </SelectTrigger>
                    <SelectContent>
                      {patients?.map((p) => (
                        <SelectItem key={p.id} value={String(p.id)}>
                          {p.user?.firstName} {p.user?.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Reason</label>
                  <Textarea
                    placeholder="Explain why you need access to this patient's records..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                    data-testid="input-reason"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (!selectedPatientId || !reason.trim()) {
                      toast({
                        title: "Missing fields",
                        description: "Please select a patient and provide a reason",
                        variant: "destructive",
                      });
                      return;
                    }
                    createMutation.mutate({
                      patientId: parseInt(selectedPatientId),
                      reason: reason.trim(),
                    });
                  }}
                  disabled={createMutation.isPending}
                  data-testid="button-submit-request"
                >
                  {createMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Send Request
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Pending count for patients */}
      {user?.role === "patient" && pendingCount > 0 && (
        <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950">
          <CardContent className="pt-4 pb-3 px-4 flex items-center gap-3">
            <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            <p className="text-sm font-medium">
              You have <strong>{pendingCount}</strong> pending access request{pendingCount > 1 ? "s" : ""} to review.
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4 flex-wrap">
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              {user?.role === "patient" ? "Record Access Requests" : "Request Management"}
            </CardTitle>
            <div className="flex-1" />
            <div className="relative min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40" data-testid="select-status-filter">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Requests</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="denied">Denied</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredRequests && filteredRequests.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      {user?.role === "patient" ? "Requesting Doctor" : "Requester"}
                    </TableHead>
                    {user?.role !== "patient" && <TableHead>Patient</TableHead>}
                    <TableHead>Reason</TableHead>
                    <TableHead>Requested</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reviewed By</TableHead>
                    {canReview && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((request) => (
                    <TableRow key={request.id} data-testid={`row-request-${request.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">
                              {request.requester?.firstName} {request.requester?.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {request.requester?.role}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      {user?.role !== "patient" && (
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {request.patient?.user?.firstName} {request.patient?.user?.lastName}
                            </span>
                          </div>
                        </TableCell>
                      )}
                      <TableCell>
                        <span className="max-w-xs truncate block text-sm">
                          {request.reason}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm">
                          {request.requestedAt
                            ? new Date(request.requestedAt).toLocaleDateString()
                            : "N/A"}
                        </span>
                      </TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell>
                        {request.approver ? (
                          <span className="text-sm">
                            {request.approver.firstName} {request.approver.lastName}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      {canReview && (
                        <TableCell className="text-right">
                          {request.status === "pending" && (
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                onClick={() =>
                                  updateMutation.mutate({
                                    id: request.id,
                                    status: "approved",
                                  })
                                }
                                disabled={updateMutation.isPending}
                                data-testid={`button-approve-${request.id}`}
                              >
                                {updateMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Approve
                                  </>
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() =>
                                  updateMutation.mutate({
                                    id: request.id,
                                    status: "denied",
                                  })
                                }
                                disabled={updateMutation.isPending}
                                data-testid={`button-deny-${request.id}`}
                              >
                                {updateMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Deny
                                  </>
                                )}
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Access Requests</h3>
              <p className="text-muted-foreground">
                {user?.role === "patient"
                  ? "No doctor has requested access to your records yet."
                  : user?.role === "doctor"
                  ? "You haven't requested access to any patient records yet."
                  : statusFilter !== "all"
                  ? `No ${statusFilter} requests found`
                  : "No access requests have been made yet"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
