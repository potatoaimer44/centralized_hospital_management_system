import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { format } from "date-fns";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import type { User, Patient } from "@shared/schema";

const formSchema = z.object({
    patientId: z.string().optional(),
    doctorId: z.string().min(1, "Please select a doctor"),
    date: z.string().min(1, "Please select a date"),
    time: z.string().min(1, "Please select a time"),
    reason: z.string().min(1, "Please enter a reason"),
});

export default function NewAppointmentPage() {
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const { user } = useAuth();

    const { data: users } = useQuery<User[]>({
        queryKey: ["/api/users"],
    });

    const { data: patients } = useQuery<(Patient & { user: User })[]>({
        queryKey: ["/api/patients"],
        enabled: user?.role !== "patient",
    });

    // Filter for doctors
    const doctors = users?.filter((u) => u.role === "doctor") || [];

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            patientId: "",
            doctorId: "",
            date: format(new Date(), "yyyy-MM-dd"),
            time: "09:00",
            reason: "",
        },
    });

    const createMutation = useMutation({
        mutationFn: async (values: z.infer<typeof formSchema>) => {
            // Validate patientId for non-patients
            if (user?.role !== "patient" && !values.patientId) {
                throw new Error("Please select a patient");
            }

            // Combine date and time
            const startDateTime = new Date(`${values.date}T${values.time}`);
            const endDateTime = new Date(startDateTime.getTime() + 30 * 60000); // 30 mins default

            const res = await apiRequest("POST", "/api/appointments", {
                patientId: values.patientId ? parseInt(values.patientId) : undefined,
                doctorId: values.doctorId,
                startTime: startDateTime.toISOString(),
                endTime: endDateTime.toISOString(),
                reason: values.reason,
            });
            return await res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
            toast({
                title: "Appointment Booked",
                description: "Your appointment has been successfully scheduled.",
            });
            setLocation("/appointments");
        },
        onError: (error: Error) => {
            toast({
                title: "Booking Failed",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    function onSubmit(values: z.infer<typeof formSchema>) {
        createMutation.mutate(values);
    }

    return (
        <div className="max-w-2xl mx-auto p-8">
            <Card>
                <CardHeader>
                    <CardTitle>Book New Appointment</CardTitle>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            {user?.role !== "patient" && (
                                <FormField
                                    control={form.control}
                                    name="patientId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Select Patient</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Choose a patient" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {patients?.map((p) => (
                                                        <SelectItem key={p.id} value={p.id.toString()}>
                                                            {p.user?.firstName} {p.user?.lastName} (ID: {p.id})
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}

                            <FormField
                                control={form.control}
                                name="doctorId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Select Doctor</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Choose a doctor" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {doctors.map((doctor) => (
                                                    <SelectItem key={doctor.id} value={doctor.id}>
                                                        Dr. {doctor.firstName} {doctor.lastName}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="date"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Date</FormLabel>
                                            <FormControl>
                                                <Input type="date" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="time"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Time</FormLabel>
                                            <FormControl>
                                                <Input type="time" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="reason"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Reason for Visit</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Please describe your symptoms or reason for visit..."
                                                className="min-h-[100px]"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="flex justify-end space-x-4">
                                <Button
                                    variant="outline"
                                    type="button"
                                    onClick={() => setLocation("/appointments")}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={createMutation.isPending}>
                                    {createMutation.isPending ? "Booking..." : "Book Appointment"}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
