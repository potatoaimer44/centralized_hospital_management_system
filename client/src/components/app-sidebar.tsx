import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { RoleBadge } from "@/components/role-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Building2,
  Users,
  FileText,
  Activity,
  Shield,
  ClipboardList,
  Home,
  UserPlus,
  Stethoscope,
  HeartPulse,
  History,
  LogOut,
  ChevronUp,
  AlertTriangle,
  Calendar,
  Bell,
} from "lucide-react";
import type { UserRole } from "@shared/schema";

const adminMenuItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Appointments", url: "/appointments", icon: Calendar },
  { title: "Users", url: "/users", icon: Users },
  { title: "Hospitals", url: "/hospitals", icon: Building2 },
  { title: "Patients", url: "/patients", icon: UserPlus },
  { title: "Access Requests", url: "/access-requests", icon: ClipboardList },
  { title: "Audit Logs", url: "/audit-logs", icon: History },
  { title: "Security Alerts", url: "/security-alerts", icon: Shield },
];

const doctorMenuItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Appointments", url: "/appointments", icon: Calendar },
  { title: "Patients", url: "/patients", icon: Users },
  { title: "Medical Records", url: "/medical-records", icon: FileText },
  { title: "Access Requests", url: "/access-requests", icon: ClipboardList },
];

const nurseMenuItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Appointments", url: "/appointments", icon: Calendar },
  { title: "Patients", url: "/patients", icon: Users },
  { title: "Vital Signs", url: "/vital-signs", icon: HeartPulse },
];

const patientMenuItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Appointments", url: "/appointments", icon: Calendar },
  { title: "My Records", url: "/my-records", icon: FileText },
  { title: "Vital Signs", url: "/my-vitals", icon: Activity },
];

const menuByRole: Record<UserRole, typeof adminMenuItems> = {
  admin: adminMenuItems,
  doctor: doctorMenuItems,
  nurse: nurseMenuItems,
  patient: patientMenuItems,
};

export function AppSidebar() {
  const [location] = useLocation();
  const { user } = useAuth();

  const role = (user?.role as UserRole) || "patient";
  const menuItems = menuByRole[role] || patientMenuItems;

  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    return user?.email?.[0]?.toUpperCase() || "U";
  };

  const getFullName = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user?.email || "User";
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary rounded-md">
            <Stethoscope className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">MedRecord</h1>
            <p className="text-xs text-muted-foreground">Kathmandu Valley</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {role === "admin" && (
          <SidebarGroup>
            <SidebarGroupLabel>Quick Actions</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/users/new">
                      <UserPlus className="h-4 w-4" />
                      <span>Add User</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/hospitals/new">
                      <Building2 className="h-4 w-4" />
                      <span>Add Hospital</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {role === "doctor" && (
          <SidebarGroup>
            <SidebarGroupLabel>Quick Actions</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/medical-records/new">
                      <FileText className="h-4 w-4" />
                      <span>New Record</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-2 border-t border-sidebar-border">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex items-center gap-3 w-full p-2 rounded-md hover-elevate"
              data-testid="button-user-menu"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.profileImageUrl || undefined} alt={getFullName()} />
                <AvatarFallback className="text-xs">{getInitials()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium truncate">{getFullName()}</p>
                <RoleBadge role={role} className="mt-0.5" />
              </div>
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem asChild>
              <Link href="/notifications" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Notifications
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <a href="/api/logout" className="flex items-center gap-2 text-destructive" data-testid="button-logout">
                <LogOut className="h-4 w-4" />
                Log out
              </a>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
