import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { format } from "date-fns";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Calendar, Clock, User as UserIcon, MapPin, Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Appointment, User, Patient, Hospital } from "@shared/schema";

type AppointmentWithDetails = Appointment & {
    patient: Patient;
    doctor: User;
    hospital: Hospital;
};

export default function AppointmentsPage() {
    const { user } = useAuth();
    const { toast } = useToast();

    const { data: appointments, isLoading } = useQuery<AppointmentWithDetails[]>({
        queryKey: ["/api/appointments"],
    });

    const updateStatusMutation = useMutation({
        mutationFn: async ({ id, status }: { id: number; status: string }) => {
            const res = await apiRequest("PATCH", `/api/appointments/${id}/status`, {
                status,
            });
            return await res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
            toast({
                title: "Status updated",
                description: "Appointment status has been updated successfully.",
            });
        },
        onError: (error: Error) => {
            toast({
                title: "Failed to update",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    if (isLoading) {
        return <div className="p-8">Loading appointments...</div>;
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case "scheduled":
                return "bg-blue-100 text-blue-800";
            case "completed":
                return "bg-green-100 text-green-800";
            case "cancelled":
                return "bg-red-100 text-red-800";
            case "no_show":
                return "bg-gray-100 text-gray-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    return (
        <div className="p-8 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Appointments</h1>
                    <p className="text-muted-foreground mt-2">
                        Manage your scheduled consultations and visits.
                    </p>
                </div>
                <Link href="/appointments/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        New Appointment
                    </Button>
                </Link>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {appointments?.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-muted-foreground">
                        No appointments found.
                    </div>
                ) : (
                    appointments?.map((appointment) => (
                        <Card key={appointment.id} className="overflow-hidden">
                            <CardHeader className="pb-4">
                                <div className="flex items-start justify-between">
                                    <Badge
                                        variant="secondary"
                                        className={getStatusColor(appointment.status || "scheduled")}
                                    >
                                        {(appointment.status || "scheduled").toUpperCase().replace("_", " ")}
                                    </Badge>
                                    {user?.role === "doctor" && (
                                        <Select
                                            defaultValue={appointment.status || "scheduled"}
                                            onValueChange={(value) =>
                                                updateStatusMutation.mutate({
                                                    id: appointment.id,
                                                    status: value,
                                                })
                                            }
                                        >
                                            <SelectTrigger className="w-[130px] h-8 text-xs">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="scheduled">Scheduled</SelectItem>
                                                <SelectItem value="completed">Completed</SelectItem>
                                                <SelectItem value="cancelled">Cancelled</SelectItem>
                                                <SelectItem value="no_show">No Show</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}
                                </div>
                                <CardTitle className="mt-4 text-xl">
                                    {user?.role === "patient"
                                        ? `Dr. ${appointment.doctor.firstName} ${appointment.doctor.lastName}`
                                        : `Patient ID: ${appointment.patientId}`}
                                </CardTitle>
                                <CardDescription>
                                    {appointment.reason || "Regular Check-up"}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center text-sm text-gray-600">
                                    <Calendar className="mr-2 h-4 w-4" />
                                    {format(new Date(appointment.startTime), "PPP")}
                                </div>
                                <div className="flex items-center text-sm text-gray-600">
                                    <Clock className="mr-2 h-4 w-4" />
                                    {format(new Date(appointment.startTime), "p")} -{" "}
                                    {format(new Date(appointment.endTime), "p")}
                                </div>
                                <div className="flex items-center text-sm text-gray-600">
                                    <MapPin className="mr-2 h-4 w-4" />
                                    {appointment.hospital.name}
                                </div>
                                {user?.role !== "patient" && appointment.patient && (
                                    <div className="flex items-center text-sm text-gray-600">
                                        <UserIcon className="mr-2 h-4 w-4" />
                                        Patient #{appointment.patientId}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
