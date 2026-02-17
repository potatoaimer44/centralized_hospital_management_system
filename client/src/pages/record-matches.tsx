import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
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
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  GitMerge,
  CheckCircle,
  XCircle,
  Clock,
  User,
  FileText,
  Calendar,
  Droplets,
  Loader2,
  AlertTriangle,
  ArrowRight,
  Shield,
  Brain,
  Sparkles,
  BarChart3,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import type { User as UserType, Patient, MedicalRecord } from "@shared/schema";

interface FieldScore {
  match: boolean;
  similarity: number;
}

type RecordMatchWithDetails = {
  id: number;
  newPatientId: number;
  existingPatientId: number;
  matchConfidence: string;
  matchedFields: Record<string, FieldScore | boolean>;
  aiScore: string | null;
  aiReasoning: string | null;
  status: string | null;
  reviewedBy: string | null;
  createdAt: string | null;
  reviewedAt: string | null;
  newPatient?: Patient & { user: UserType | null };
  existingPatient?: Patient & { user: UserType | null };
  existingRecordCount?: number;
  existingRecords?: MedicalRecord[];
};

type RecordMatchSummary = {
  id: number;
  newPatientId: number;
  existingPatientId: number;
  matchConfidence: string;
  matchedFields: Record<string, FieldScore | boolean>;
  aiScore: string | null;
  aiReasoning: string | null;
  status: string | null;
  createdAt: string | null;
  reviewedAt: string | null;
};

export default function RecordMatchesPage() {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [detailMatch, setDetailMatch] = useState<RecordMatchWithDetails | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const { data: matches, isLoading } = useQuery<RecordMatchSummary[]>({
    queryKey: ["/api/record-matches"],
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await apiRequest("PATCH", `/api/record-matches/${id}`, { status });
      return response.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/record-matches"] });
      setDetailOpen(false);
      setDetailMatch(null);
      toast({
        title: variables.status === "approved" ? "Records Merged" : "Match Denied",
        description:
          variables.status === "approved"
            ? "The existing medical records have been merged into the new patient's profile."
            : "The match has been denied. No records were changed.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update match",
        variant: "destructive",
      });
    },
  });

  const openDetail = async (id: number) => {
    setLoadingDetail(true);
    setDetailOpen(true);
    try {
      const res = await fetch(`/api/record-matches/${id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load details");
      const data = await res.json();
      setDetailMatch(data);
    } catch {
      toast({ title: "Error", description: "Failed to load match details", variant: "destructive" });
      setDetailOpen(false);
    } finally {
      setLoadingDetail(false);
    }
  };

  const filteredMatches = matches?.filter((m) => {
    if (statusFilter === "all") return true;
    return m.status === statusFilter;
  });

  const pendingCount = matches?.filter((m) => m.status === "pending").length ?? 0;

  const getConfidenceBadge = (confidence: string, aiScore?: string | null) => {
    const scoreNum = aiScore ? parseFloat(aiScore) : null;
    const scoreLabel = scoreNum !== null ? ` (${(scoreNum * 100).toFixed(0)}%)` : "";
    if (confidence === "high") {
      return (
        <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
          <Brain className="h-3 w-3 mr-1" /> High{scoreLabel}
        </Badge>
      );
    }
    if (confidence === "medium") {
      return (
        <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
          <Brain className="h-3 w-3 mr-1" /> Medium{scoreLabel}
        </Badge>
      );
    }
    return (
      <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
        <Brain className="h-3 w-3 mr-1" /> Low{scoreLabel}
      </Badge>
    );
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            <CheckCircle className="mr-1 h-3 w-3" /> Merged
          </Badge>
        );
      case "denied":
        return (
          <Badge variant="destructive">
            <XCircle className="mr-1 h-3 w-3" /> Denied
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <Clock className="mr-1 h-3 w-3" /> Pending Review
          </Badge>
        );
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-semibold flex items-center gap-3">
          <Brain className="h-8 w-8" />
          AI Record Matching
        </h1>
        <p className="text-muted-foreground mt-1">
          When a new patient registers, our hybrid AI pipeline automatically detects potential duplicates using
          fuzzy string matching (Stage 1) and LLM verification (Stage 2). Review the AI's analysis below.
        </p>
      </div>

      {pendingCount > 0 && (
        <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950">
          <CardContent className="pt-4 pb-3 px-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            <p className="text-sm font-medium">
              <strong>{pendingCount}</strong> pending record match{pendingCount > 1 ? "es" : ""} need your review.
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <CardTitle>Match Requests</CardTitle>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Merged</SelectItem>
                <SelectItem value="denied">Denied</SelectItem>
                <SelectItem value="all">All</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : filteredMatches && filteredMatches.length > 0 ? (
            <div className="space-y-3">
              {filteredMatches.map((match) => {
                const aiPct = match.aiScore ? (parseFloat(match.aiScore) * 100).toFixed(0) : null;
                return (
                  <div
                    key={match.id}
                    className="border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => openDetail(match.id)}
                  >
                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="p-2 bg-primary/10 rounded-md">
                          <Brain className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm">
                            New Patient #{match.newPatientId}
                            <ArrowRight className="inline h-3 w-3 mx-2 text-muted-foreground" />
                            Existing Patient #{match.existingPatientId}
                          </p>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {match.aiReasoning || "Matched by fuzzy similarity"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {aiPct && (
                          <Badge variant="outline" className="font-mono text-xs">
                            <Sparkles className="h-3 w-3 mr-1 text-violet-500" />
                            AI: {aiPct}%
                          </Badge>
                        )}
                        {getConfidenceBadge(match.matchConfidence, match.aiScore)}
                        {getStatusBadge(match.status)}
                      </div>
                      <span className="text-xs text-muted-foreground font-mono">
                        {match.createdAt ? new Date(match.createdAt).toLocaleDateString() : ""}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <GitMerge className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Record Matches</h3>
              <p className="text-muted-foreground">
                {statusFilter === "pending"
                  ? "No pending matches to review"
                  : "No matches found for this filter"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail / Review Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {loadingDetail || !detailMatch ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <GitMerge className="h-5 w-5" />
                  Record Match Review
                </DialogTitle>
                <DialogDescription>
                  Compare the newly registered patient with the existing record. If they are the same person,
                  approve to merge the existing medical records into the new account.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="flex items-center gap-2 flex-wrap">
                  {getConfidenceBadge(detailMatch.matchConfidence, detailMatch.aiScore)}
                  {getStatusBadge(detailMatch.status)}
                  {detailMatch.aiScore && (
                    <Badge variant="outline" className="font-mono text-xs">
                      <Sparkles className="h-3 w-3 mr-1 text-violet-500" />
                      AI Score: {(parseFloat(detailMatch.aiScore) * 100).toFixed(1)}%
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground ml-auto">
                    Created: {detailMatch.createdAt ? new Date(detailMatch.createdAt).toLocaleString() : "N/A"}
                  </span>
                </div>

                {/* AI Reasoning Card */}
                {detailMatch.aiReasoning && (
                  <Card className="border-violet-200 bg-violet-50/50 dark:border-violet-900 dark:bg-violet-950/30">
                    <CardContent className="pt-3 pb-3 px-4">
                      <div className="flex items-start gap-3">
                        <Brain className="h-5 w-5 text-violet-600 dark:text-violet-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-violet-700 dark:text-violet-300 mb-1">
                            AI Analysis
                          </p>
                          <p className="text-sm text-violet-900 dark:text-violet-100">
                            {detailMatch.aiReasoning}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Side-by-side comparison */}
                <div className="grid grid-cols-2 gap-4">
                  {/* New Patient */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <User className="h-4 w-4 text-blue-600" />
                        Newly Registered
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Name: </span>
                        <strong>
                          {detailMatch.newPatient?.user?.firstName} {detailMatch.newPatient?.user?.lastName}
                        </strong>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">DOB: </span>
                        <span>{detailMatch.newPatient?.dateOfBirth || "N/A"}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Droplets className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">Blood: </span>
                        <span>{detailMatch.newPatient?.bloodGroup || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Gender: </span>
                        <span>{detailMatch.newPatient?.gender || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Email: </span>
                        <span>{detailMatch.newPatient?.user?.email || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Address: </span>
                        <span>{detailMatch.newPatient?.address || "N/A"}</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Existing Patient */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <FileText className="h-4 w-4 text-orange-600" />
                        Existing Record
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Name: </span>
                        <strong>
                          {detailMatch.existingPatient?.user?.firstName} {detailMatch.existingPatient?.user?.lastName}
                        </strong>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">DOB: </span>
                        <span>{detailMatch.existingPatient?.dateOfBirth || "N/A"}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Droplets className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">Blood: </span>
                        <span>{detailMatch.existingPatient?.bloodGroup || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Gender: </span>
                        <span>{detailMatch.existingPatient?.gender || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Email: </span>
                        <span>{detailMatch.existingPatient?.user?.email || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Address: </span>
                        <span>{detailMatch.existingPatient?.address || "N/A"}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Records to be merged */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">
                      Records to Merge ({detailMatch.existingRecordCount ?? 0})
                    </CardTitle>
                    <CardDescription>
                      These medical records will be moved to the new patient's profile if approved.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {detailMatch.existingRecords && detailMatch.existingRecords.length > 0 ? (
                      <div className="space-y-2">
                        {detailMatch.existingRecords.map((record) => (
                          <div key={record.id} className="flex items-center gap-3 p-2 bg-muted/50 rounded text-sm">
                            <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                            <div className="min-w-0 flex-1">
                              <span className="font-medium">
                                {record.chiefComplaint || record.diagnosis || "Medical visit"}
                              </span>
                              <span className="text-muted-foreground ml-2">
                                {record.visitDate
                                  ? new Date(record.visitDate).toLocaleDateString()
                                  : ""}
                              </span>
                            </div>
                            <Badge variant="outline" className="text-xs shrink-0">
                              Record #{record.id}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No medical records found for the existing patient profile.
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Field Similarity Scores */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      Field Similarity Scores
                    </CardTitle>
                    <CardDescription>
                      Per-field fuzzy matching results from Stage 1
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {detailMatch.matchedFields &&
                      Object.entries(detailMatch.matchedFields).map(([field, value]) => {
                        const isFieldScore = typeof value === "object" && value !== null && "similarity" in value;
                        const similarity = isFieldScore ? (value as FieldScore).similarity : (value ? 1 : 0);
                        const isMatch = isFieldScore ? (value as FieldScore).match : !!value;
                        const pct = Math.round(similarity * 100);
                        const label = field.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());

                        return (
                          <div key={field} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                {isMatch ? (
                                  <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                                ) : (
                                  <XCircle className="h-3.5 w-3.5 text-red-500" />
                                )}
                                <span className="font-medium">{label}</span>
                              </div>
                              <span className="text-xs font-mono text-muted-foreground">{pct}%</span>
                            </div>
                            <Progress
                              value={pct}
                              className={`h-2 ${
                                pct >= 80
                                  ? "[&>div]:bg-green-500"
                                  : pct >= 50
                                  ? "[&>div]:bg-yellow-500"
                                  : "[&>div]:bg-red-400"
                              }`}
                            />
                          </div>
                        );
                      })}
                  </CardContent>
                </Card>
              </div>

              {detailMatch.status === "pending" && (
                <DialogFooter className="gap-2 sm:gap-0">
                  <Button
                    variant="outline"
                    onClick={() => reviewMutation.mutate({ id: detailMatch.id, status: "denied" })}
                    disabled={reviewMutation.isPending}
                    className="text-red-600"
                  >
                    {reviewMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <XCircle className="h-4 w-4 mr-2" />
                    )}
                    Deny — Not Same Person
                  </Button>
                  <Button
                    onClick={() => reviewMutation.mutate({ id: detailMatch.id, status: "approved" })}
                    disabled={reviewMutation.isPending}
                  >
                    {reviewMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    Approve — Merge Records
                  </Button>
                </DialogFooter>
              )}

              {detailMatch.status !== "pending" && (
                <div className="text-center py-2 text-sm text-muted-foreground">
                  This match was {detailMatch.status} on{" "}
                  {detailMatch.reviewedAt ? new Date(detailMatch.reviewedAt).toLocaleString() : "N/A"}
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
