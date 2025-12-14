import { useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ChevronLeft, Save, Loader2, Thermometer, Heart, Activity, Scale, Ruler } from "lucide-react";
import type { MedicalRecord, Patient, User as UserType } from "@shared/schema";

const formSchema = z.object({
  medicalRecordId: z.string().min(1, "Medical record is required"),
  temperature: z.string().optional(),
  bloodPressure: z.string().optional(),
  pulseRate: z.string().optional(),
  respiratoryRate: z.string().optional(),
  weight: z.string().optional(),
  height: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

type MedicalRecordWithPatient = MedicalRecord & {
  patient?: Patient & { user?: UserType };
};

export default function NewVitalSignsPage() {
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const urlParams = new URLSearchParams(searchString);
  const patientIdParam = urlParams.get("patientId");
  const recordIdParam = urlParams.get("recordId");
  const { toast } = useToast();

  const { data: records } = useQuery<MedicalRecordWithPatient[]>({
    queryKey: ["/api/medical-records"],
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      medicalRecordId: recordIdParam || "",
      temperature: "",
      bloodPressure: "",
      pulseRate: "",
      respiratoryRate: "",
      weight: "",
      height: "",
    },
  });

  const watchWeight = form.watch("weight");
  const watchHeight = form.watch("height");

  const calculateBMI = (weight: string, height: string) => {
    const w = parseFloat(weight);
    const h = parseFloat(height) / 100;
    if (w > 0 && h > 0) {
      return (w / (h * h)).toFixed(2);
    }
    return null;
  };

  const bmi = calculateBMI(watchWeight || "", watchHeight || "");

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await apiRequest("POST", "/api/vital-signs", {
        medicalRecordId: parseInt(data.medicalRecordId),
        temperature: data.temperature ? parseFloat(data.temperature) : null,
        bloodPressure: data.bloodPressure || null,
        pulseRate: data.pulseRate ? parseInt(data.pulseRate) : null,
        respiratoryRate: data.respiratoryRate ? parseInt(data.respiratoryRate) : null,
        weight: data.weight ? parseFloat(data.weight) : null,
        height: data.height ? parseFloat(data.height) : null,
        bmi: bmi ? parseFloat(bmi) : null,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vital-signs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/medical-records"] });
      toast({
        title: "Success",
        description: "Vital signs recorded successfully",
      });
      navigate("/vital-signs");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to record vital signs",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    mutation.mutate(data);
  };

  const filteredRecords = patientIdParam
    ? records?.filter((r) => r.patientId.toString() === patientIdParam)
    : records;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/vital-signs")}
          data-testid="button-back"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-semibold">Record Vital Signs</h1>
          <p className="text-muted-foreground">Enter patient vital measurements</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Select Medical Record</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="medicalRecordId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Medical Record *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-record">
                          <SelectValue placeholder="Select a medical record" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {filteredRecords?.map((record) => (
                          <SelectItem key={record.id} value={record.id.toString()}>
                            {record.patient?.user?.firstName} {record.patient?.user?.lastName} -{" "}
                            {record.visitDate
                              ? new Date(record.visitDate).toLocaleDateString()
                              : "N/A"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select the patient's medical record to associate these vital signs
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Thermometer className="h-5 w-5" />
                Temperature & Vitals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="temperature"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Thermometer className="h-4 w-4" />
                        Temperature (°C)
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="36.5"
                          {...field}
                          data-testid="input-temperature"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bloodPressure"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Heart className="h-4 w-4" />
                        Blood Pressure (mmHg)
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="120/80"
                          {...field}
                          data-testid="input-blood-pressure"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pulseRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        Pulse Rate (bpm)
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="72"
                          {...field}
                          data-testid="input-pulse-rate"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="respiratoryRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Respiratory Rate (/min)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="16"
                          {...field}
                          data-testid="input-respiratory-rate"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="h-5 w-5" />
                Body Measurements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Scale className="h-4 w-4" />
                        Weight (kg)
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="65.0"
                          {...field}
                          data-testid="input-weight"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="height"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Ruler className="h-4 w-4" />
                        Height (cm)
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="170"
                          {...field}
                          data-testid="input-height"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div>
                  <label className="text-sm font-medium">BMI (calculated)</label>
                  <div className="mt-2 p-2 rounded-md bg-muted text-center">
                    <span className="text-xl font-semibold" data-testid="text-bmi">
                      {bmi || "-"}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/vital-signs")}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending} data-testid="button-submit">
              {mutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Vitals
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
