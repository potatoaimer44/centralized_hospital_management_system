import { useQuery } from "@tanstack/react-query";
import { StatCard } from "@/components/stat-card";
import { SeverityIndicator } from "@/components/severity-indicator";
import { RoleBadge } from "@/components/role-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Building2, 
  Users, 
  UserPlus, 
  ClipboardList,
  Shield,
  ArrowRight,
  Clock
} from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";
import type { User, Hospital, SecurityAlert, AccessRequest, AuditLog, AlertSeverity, UserRole } from "@shared/schema";

export default function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery<{
    totalHospitals: number;
    totalUsers: number;
    totalPatients: number;
    pendingRequests: number;
  }>({
    queryKey: ["/api/admin/stats"],
  });

  const { data: recentAlerts, isLoading: alertsLoading } = useQuery<SecurityAlert[]>({
    queryKey: ["/api/security-alerts", { limit: 5 }],
  });

  const { data: pendingRequests, isLoading: requestsLoading } = useQuery<AccessRequest[]>({
    queryKey: ["/api/access-requests", { status: "pending", limit: 5 }],
  });

  const { data: recentLogs, isLoading: logsLoading } = useQuery<AuditLog[]>({
    queryKey: ["/api/audit-logs", { limit: 5 }],
  });

  const { data: recentUsers, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/users", { limit: 5 }],
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-semibold">Admin Dashboard</h1>
          <p className="text-muted-foreground">System overview and management</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button asChild data-testid="button-add-user">
            <Link href="/users/new">
              <UserPlus className="h-4 w-4 mr-2" />
              Add User
            </Link>
          </Button>
          <Button variant="outline" asChild data-testid="button-add-hospital">
            <Link href="/hospitals/new">
              <Building2 className="h-4 w-4 mr-2" />
              Add Hospital
            </Link>
          </Button>
        </div>
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
              title="Total Hospitals"
              value={stats?.totalHospitals || 0}
              icon={Building2}
              description="Registered facilities"
            />
            <StatCard
              title="Total Users"
              value={stats?.totalUsers || 0}
              icon={Users}
              description="Active accounts"
            />
            <StatCard
              title="Total Patients"
              value={stats?.totalPatients || 0}
              icon={UserPlus}
              description="Registered patients"
            />
            <StatCard
              title="Pending Requests"
              value={stats?.pendingRequests || 0}
              icon={ClipboardList}
              description="Awaiting approval"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="overflow-visible">
          <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
            <div>
              <CardTitle className="text-lg">Security Alerts</CardTitle>
              <CardDescription>Recent system alerts</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/security-alerts">
                View All
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {alertsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : recentAlerts?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Shield className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p>No security alerts</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentAlerts?.map((alert) => (
                  <div 
                    key={alert.id} 
                    className="flex items-start justify-between gap-4 p-3 rounded-md bg-muted/50"
                    data-testid={`alert-item-${alert.id}`}
                  >
                    <div className="flex items-start gap-3">
                      <SeverityIndicator severity={alert.severity as AlertSeverity} />
                      <div>
                        <p className="font-medium text-sm">{alert.alertType}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {alert.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {alert.isResolved ? (
                        <Badge variant="secondary" className="text-xs">Resolved</Badge>
                      ) : (
                        <Badge variant="destructive" className="text-xs">Active</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-visible">
          <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
            <div>
              <CardTitle className="text-lg">Pending Access Requests</CardTitle>
              <CardDescription>Awaiting your review</CardDescription>
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
                    className="flex items-center justify-between gap-4 p-3 rounded-md bg-muted/50"
                    data-testid={`request-item-${request.id}`}
                  >
                    <div>
                      <p className="font-medium text-sm">Patient #{request.patientId}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {request.reason}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        Pending
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="overflow-visible">
          <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
            <div>
              <CardTitle className="text-lg">Recent Users</CardTitle>
              <CardDescription>Newly registered accounts</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/users">
                View All
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {usersLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : recentUsers?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p>No users yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentUsers?.map((user) => (
                  <div 
                    key={user.id} 
                    className="flex items-center justify-between gap-4 p-2 rounded-md hover-elevate"
                    data-testid={`user-item-${user.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.profileImageUrl || undefined} />
                        <AvatarFallback className="text-xs">
                          {user.firstName?.[0] || user.email?.[0]?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">
                          {user.firstName && user.lastName 
                            ? `${user.firstName} ${user.lastName}` 
                            : user.email}
                        </p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <RoleBadge role={user.role as UserRole} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-visible">
          <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
            <div>
              <CardTitle className="text-lg">Audit Log</CardTitle>
              <CardDescription>Recent system activity</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/audit-logs">
                View All
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {logsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : recentLogs?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p>No activity yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentLogs?.map((log) => (
                  <div 
                    key={log.id} 
                    className="flex items-center justify-between gap-4 p-2"
                    data-testid={`log-item-${log.id}`}
                  >
                    <div>
                      <p className="font-medium text-sm">{log.action}</p>
                      <p className="text-xs text-muted-foreground">
                        {log.resourceType} #{log.resourceId}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground font-mono">
                      {log.timestamp ? format(new Date(log.timestamp), "HH:mm") : ""}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
